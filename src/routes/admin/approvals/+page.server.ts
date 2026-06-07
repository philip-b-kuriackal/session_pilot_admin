import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';
import { fullName, type TaskStatus } from '$lib/types';

const TABS: TaskStatus[] = ['submitted', 'overdue', 'rejected', 'approved'];

export const load: PageServerLoad = async ({ locals, url }) => {
	const sb = locals.supabase;
	const statusParam = url.searchParams.get('status') as TaskStatus | null;
	const status: TaskStatus = statusParam && TABS.includes(statusParam) ? statusParam : 'submitted';

	const { data: instances } = await sb
		.from('task_instances')
		.select(
			'*, template:task_templates(name, priority, requires_evidence, location:locations(name))'
		)
		.eq('status', status)
		.order('due_at', { ascending: false })
		.limit(50);

	const rows = instances ?? [];
	const instanceIds = rows.map((r) => r.id);
	const templateIds = [...new Set(rows.map((r) => r.template_id).filter(Boolean))];

	// Gather all related rows in parallel.
	const [
		{ data: completions },
		{ data: evidence },
		{ data: assignees },
		{ data: checklistItems }
	] = await Promise.all([
		instanceIds.length
			? sb.from('item_completions').select('*').in('task_instance_id', instanceIds)
			: Promise.resolve({ data: [] as any[] }),
		instanceIds.length
			? sb.from('evidence').select('*').in('task_instance_id', instanceIds)
			: Promise.resolve({ data: [] as any[] }),
		instanceIds.length
			? sb.from('task_assignees').select('*').in('task_instance_id', instanceIds)
			: Promise.resolve({ data: [] as any[] }),
		templateIds.length
			? sb
					.from('checklist_items')
					.select('id, template_id, label, sort_order')
					.in('template_id', templateIds)
			: Promise.resolve({ data: [] as any[] })
	]);

	// Collect every profile id we need names for (submitters, completers, assignees).
	const profileIds = new Set<string>();
	for (const r of rows) if (r.submitted_by) profileIds.add(r.submitted_by);
	for (const c of completions ?? []) if (c.completed_by) profileIds.add(c.completed_by);
	for (const a of assignees ?? []) if (a.user_id) profileIds.add(a.user_id);

	let profileMap = new Map<string, string>();
	if (profileIds.size) {
		const { data: profiles } = await sb
			.from('profiles')
			.select('id, first_name, last_name')
			.in('id', [...profileIds]);
		for (const p of profiles ?? []) profileMap.set(p.id, fullName(p) || '—');
	}

	const itemLabel = new Map<string, string>();
	for (const ci of checklistItems ?? []) itemLabel.set(ci.id, ci.label);

	// Sign URLs for file-bearing evidence.
	const evidenceByInstance = new Map<string, any[]>();
	for (const e of evidence ?? []) {
		let signedUrl: string | null = null;
		if (e.storage_path && e.kind !== 'note') {
			const { data: signed } = await sb.storage
				.from('evidence')
				.createSignedUrl(e.storage_path, 3600);
			signedUrl = signed?.signedUrl ?? null;
		}
		const list = evidenceByInstance.get(e.task_instance_id) ?? [];
		list.push({ ...e, url: signedUrl });
		evidenceByInstance.set(e.task_instance_id, list);
	}

	const completionsByInstance = new Map<string, any[]>();
	for (const c of completions ?? []) {
		const list = completionsByInstance.get(c.task_instance_id) ?? [];
		list.push({
			...c,
			label: itemLabel.get(c.checklist_item_id) ?? 'Item',
			completed_by_name: c.completed_by ? profileMap.get(c.completed_by) ?? '—' : null
		});
		completionsByInstance.set(c.task_instance_id, list);
	}

	const assigneesByInstance = new Map<string, { user_id: string; name: string }[]>();
	for (const a of assignees ?? []) {
		const list = assigneesByInstance.get(a.task_instance_id) ?? [];
		list.push({ user_id: a.user_id, name: profileMap.get(a.user_id) ?? '—' });
		assigneesByInstance.set(a.task_instance_id, list);
	}

	const items = rows.map((r) => ({
		...r,
		submitter_name: r.submitted_by ? profileMap.get(r.submitted_by) ?? '—' : null,
		completions: (completionsByInstance.get(r.id) ?? []).sort((a, b) =>
			a.label.localeCompare(b.label)
		),
		evidence: evidenceByInstance.get(r.id) ?? [],
		assignees: assigneesByInstance.get(r.id) ?? []
	}));

	return { items, status, tabs: TABS };
};

async function decide(
	locals: App.Locals,
	instanceId: string,
	decision: 'approved' | 'rejected',
	reason: string | null
) {
	const sb = locals.supabase;

	// Look up template name + assignees for notifications.
	const { data: instance } = await sb
		.from('task_instances')
		.select('id, template:task_templates(name)')
		.eq('id', instanceId)
		.single();
	const name = (instance as any)?.template?.name ?? 'Task';

	const { error: aErr } = await sb.from('approvals').insert({
		task_instance_id: instanceId,
		reviewed_by: locals.user!.id,
		decision,
		reason
	});
	if (aErr) return fail(500, { message: aErr.message });

	const { error: uErr } = await sb
		.from('task_instances')
		.update({ status: decision })
		.eq('id', instanceId);
	if (uErr) return fail(500, { message: uErr.message });

	const { data: assignees } = await sb
		.from('task_assignees')
		.select('user_id')
		.eq('task_instance_id', instanceId);

	if (assignees?.length) {
		const isApprove = decision === 'approved';
		await sb.from('notifications').insert(
			assignees.map((a) => ({
				user_id: a.user_id,
				kind: isApprove ? 'task_approved' : 'task_rejected',
				title: `${isApprove ? 'Task approved' : 'Task rejected'}: ${name}`,
				body: isApprove ? null : reason,
				link: `/tasks/${instanceId}`
			}))
		);
	}

	await audit(
		locals,
		decision === 'approved' ? 'task.approved' : 'task.rejected',
		'task_instance',
		instanceId,
		reason ? { reason } : {}
	);

	return { success: true };
}

export const actions: Actions = {
	approve: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing task id' });
		return decide(locals, id, 'approved', null);
	},

	reject: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		const reason = form.get('reason')?.toString().trim();
		if (!id) return fail(400, { message: 'Missing task id' });
		if (!reason) return fail(400, { message: 'A reason is required to reject a task.' });
		return decide(locals, id, 'rejected', reason);
	}
};

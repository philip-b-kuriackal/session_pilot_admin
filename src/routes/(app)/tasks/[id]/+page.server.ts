import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { data: instance } = await locals.supabase
		.from('task_instances')
		.select(
			`*,
			template:task_templates(
				id, name, description, priority, requires_evidence, evidence_kind, requires_approval, location_id,
				location:locations(name),
				sop:sops(id, name, description, sop_steps(id, step_number, title, description, attachments)),
				checklist_items(id, label, mandatory, requires_evidence, sort_order)
			)`
		)
		.eq('id', params.id)
		.maybeSingle();

	if (!instance) error(404, 'Task not found');

	const [{ data: completions }, { data: evidence }, { data: approvals }] = await Promise.all([
		locals.supabase.from('item_completions').select('*').eq('task_instance_id', params.id),
		locals.supabase
			.from('evidence')
			.select('*')
			.eq('task_instance_id', params.id)
			.order('created_at'),
		locals.supabase
			.from('approvals')
			.select('*')
			.eq('task_instance_id', params.id)
			.order('created_at', { ascending: false })
	]);

	// signed URLs for uploaded media
	const evidenceWithUrls = await Promise.all(
		(evidence ?? []).map(async (e) => {
			if (e.kind !== 'note' && e.storage_path) {
				const { data: signed } = await locals.supabase.storage
					.from('evidence')
					.createSignedUrl(e.storage_path, 3600);
				return { ...e, url: signed?.signedUrl ?? null };
			}
			return { ...e, url: null };
		})
	);

	const items = [...(instance.template?.checklist_items ?? [])].sort(
		(a, b) => a.sort_order - b.sort_order
	);
	const steps = [...(instance.template?.sop?.sop_steps ?? [])].sort(
		(a, b) => a.step_number - b.step_number
	);

	return {
		instance,
		items,
		steps,
		completions: completions ?? [],
		evidence: evidenceWithUrls,
		lastApproval: approvals?.[0] ?? null
	};
};

export const actions: Actions = {
	toggleItem: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401, { message: 'Not signed in' });
		const form = await request.formData();
		const itemId = form.get('item_id')?.toString();
		const done = form.get('done')?.toString() === 'true';
		const comment = form.get('comment')?.toString().trim() || null;
		if (!itemId) return fail(400, { message: 'Missing item' });

		if (done) {
			const { error: err } = await locals.supabase.from('item_completions').upsert(
				{
					task_instance_id: params.id,
					checklist_item_id: itemId,
					completed: true,
					comment,
					completed_by: locals.user.id
				},
				{ onConflict: 'task_instance_id,checklist_item_id' }
			);
			if (err) return fail(500, { message: err.message });
			// first activity moves the task to in_progress
			await locals.supabase
				.from('task_instances')
				.update({ status: 'in_progress' })
				.eq('id', params.id)
				.in('status', ['pending', 'overdue']);
		} else {
			const { error: err } = await locals.supabase
				.from('item_completions')
				.delete()
				.eq('task_instance_id', params.id)
				.eq('checklist_item_id', itemId);
			if (err) return fail(500, { message: err.message });
		}
		return { success: true };
	},

	uploadEvidence: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401, { message: 'Not signed in' });
		const form = await request.formData();
		const file = form.get('file') as File | null;
		const note = form.get('note')?.toString().trim();
		const itemId = form.get('item_id')?.toString() || null;

		if (file && file.size > 0) {
			const ext = file.name.split('.').pop() || 'jpg';
			const path = `${params.id}/${Date.now()}.${ext}`;
			const { error: upErr } = await locals.supabase.storage
				.from('evidence')
				.upload(path, file, { contentType: file.type });
			if (upErr) return fail(500, { message: `Upload failed: ${upErr.message}` });

			const kind = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'photo' : 'file';
			const { error: insErr } = await locals.supabase.from('evidence').insert({
				task_instance_id: params.id,
				checklist_item_id: itemId,
				kind,
				storage_path: path,
				uploaded_by: locals.user.id
			});
			if (insErr) return fail(500, { message: insErr.message });
		} else if (note) {
			const { error: insErr } = await locals.supabase.from('evidence').insert({
				task_instance_id: params.id,
				checklist_item_id: itemId,
				kind: 'note',
				note,
				uploaded_by: locals.user.id
			});
			if (insErr) return fail(500, { message: insErr.message });
		} else {
			return fail(400, { message: 'Choose a photo or write a note first.' });
		}
		return { success: true };
	},

	deleteEvidence: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing id' });
		const { error: err } = await locals.supabase.from('evidence').delete().eq('id', id);
		if (err) return fail(500, { message: err.message });
		return { success: true };
	},

	submit: async ({ locals, params }) => {
		if (!locals.user) return fail(401, { message: 'Not signed in' });

		// validate: all mandatory items completed + evidence present if required
		const { data: instance } = await locals.supabase
			.from('task_instances')
			.select('*, template:task_templates(name, requires_evidence, requires_approval, location_id, checklist_items(id, mandatory))')
			.eq('id', params.id)
			.single();
		if (!instance) return fail(404, { message: 'Task not found' });

		const { data: completions } = await locals.supabase
			.from('item_completions')
			.select('checklist_item_id')
			.eq('task_instance_id', params.id);
		const doneIds = new Set((completions ?? []).map((c) => c.checklist_item_id));
		const missing = (instance.template?.checklist_items ?? []).filter(
			(i: { id: string; mandatory: boolean }) => i.mandatory && !doneIds.has(i.id)
		);
		if (missing.length > 0) {
			return fail(400, { message: `Complete all mandatory items first (${missing.length} left).` });
		}

		if (instance.template?.requires_evidence) {
			const { count } = await locals.supabase
				.from('evidence')
				.select('id', { count: 'exact', head: true })
				.eq('task_instance_id', params.id);
			if (!count) return fail(400, { message: 'This task requires evidence — add a photo or note first.' });
		}

		// Approval is opt-in per template: without it the task completes immediately.
		const needsApproval = instance.template?.requires_approval ?? false;
		const { error: upErr } = await locals.supabase
			.from('task_instances')
			.update({
				status: needsApproval ? 'submitted' : 'completed',
				submitted_at: new Date().toISOString(),
				submitted_by: locals.user.id
			})
			.eq('id', params.id);
		if (upErr) return fail(500, { message: upErr.message });

		if (needsApproval) {
			// notify managers for review
			await locals.supabase.rpc('notify_managers', {
				p_location: instance.template?.location_id ?? null,
				p_kind: 'general',
				p_title: `Submitted for review: ${instance.template?.name}`,
				p_body: 'A task was submitted and needs your approval.',
				p_link: '/admin/approvals'
			});
		}

		await locals.supabase.from('audit_logs').insert({
			organization_id: locals.profile?.organization_id ?? null,
			actor_id: locals.user.id,
			action: needsApproval ? 'task.submitted' : 'task.completed',
			entity_type: 'task_instance',
			entity_id: params.id
		});

		redirect(303, `/tasks/${params.id}`);
	}
};

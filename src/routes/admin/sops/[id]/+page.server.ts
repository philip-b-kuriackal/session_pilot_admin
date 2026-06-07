import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';
import type { SopStep } from '$lib/types';

type Attachment = { type: 'image' | 'video' | 'pdf' | 'link'; url: string; label?: string };

export const load: PageServerLoad = async ({ params, locals }) => {
	const [{ data: sop }, { data: departments }] = await Promise.all([
		locals.supabase
			.from('sops')
			.select('*, department:departments(name), sop_steps(*)')
			.eq('id', params.id)
			.single(),
		locals.supabase.from('departments').select('*').order('name')
	]);

	if (!sop) throw error(404, 'SOP not found');

	// order steps by step_number
	sop.sop_steps = (sop.sop_steps ?? []).sort(
		(a: SopStep, b: SopStep) => a.step_number - b.step_number
	);

	return { sop, departments: departments ?? [] };
};

/** Re-number all steps of a SOP sequentially starting at 1 (by current step_number). */
async function renumber(supabase: App.Locals['supabase'], sopId: string) {
	const { data: steps } = await supabase
		.from('sop_steps')
		.select('id, step_number')
		.eq('sop_id', sopId)
		.order('step_number');
	if (!steps) return;
	let n = 1;
	for (const s of steps) {
		if (s.step_number !== n) {
			await supabase.from('sop_steps').update({ step_number: n }).eq('id', s.id);
		}
		n++;
	}
}

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { message: 'Name is required' });

		const { error: err } = await locals.supabase
			.from('sops')
			.update({
				name,
				description: form.get('description')?.toString() || null,
				category: form.get('category')?.toString() || null,
				department_id: form.get('department_id')?.toString() || null
			})
			.eq('id', params.id);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'sop.updated', 'sop', params.id, { name });
		return { success: true };
	},

	addStep: async ({ request, params, locals }) => {
		const form = await request.formData();
		const title = form.get('title')?.toString().trim();
		if (!title) return fail(400, { message: 'Step title is required' });

		const { data: last } = await locals.supabase
			.from('sop_steps')
			.select('step_number')
			.eq('sop_id', params.id)
			.order('step_number', { ascending: false })
			.limit(1)
			.maybeSingle();
		const nextNumber = (last?.step_number ?? 0) + 1;

		const { data: step, error: err } = await locals.supabase
			.from('sop_steps')
			.insert({
				sop_id: params.id,
				step_number: nextNumber,
				title,
				description: form.get('description')?.toString() || null,
				attachments: []
			})
			.select()
			.single();
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'sop.step_added', 'sop', params.id, { step_id: step.id, title });
		return { success: true };
	},

	updateStep: async ({ request, params, locals }) => {
		const form = await request.formData();
		const stepId = form.get('step_id')?.toString();
		const title = form.get('title')?.toString().trim();
		if (!stepId) return fail(400, { message: 'Missing step id' });
		if (!title) return fail(400, { message: 'Step title is required' });

		const { error: err } = await locals.supabase
			.from('sop_steps')
			.update({
				title,
				description: form.get('description')?.toString() || null
			})
			.eq('id', stepId);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'sop.step_updated', 'sop', params.id, { step_id: stepId });
		return { success: true };
	},

	deleteStep: async ({ request, params, locals }) => {
		const form = await request.formData();
		const stepId = form.get('step_id')?.toString();
		if (!stepId) return fail(400, { message: 'Missing step id' });

		const { error: err } = await locals.supabase.from('sop_steps').delete().eq('id', stepId);
		if (err) return fail(500, { message: err.message });

		await renumber(locals.supabase, params.id);
		await audit(locals, 'sop.step_deleted', 'sop', params.id, { step_id: stepId });
		return { success: true };
	},

	moveStep: async ({ request, params, locals }) => {
		const form = await request.formData();
		const stepId = form.get('step_id')?.toString();
		const dir = form.get('dir')?.toString(); // 'up' | 'down'
		if (!stepId || !dir) return fail(400, { message: 'Missing parameters' });

		const { data: steps } = await locals.supabase
			.from('sop_steps')
			.select('id, step_number')
			.eq('sop_id', params.id)
			.order('step_number');
		if (!steps) return fail(500, { message: 'Could not load steps' });

		const idx = steps.findIndex((s) => s.id === stepId);
		if (idx === -1) return fail(404, { message: 'Step not found' });
		const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
		if (swapIdx < 0 || swapIdx >= steps.length) return { success: true }; // at edge, no-op

		const a = steps[idx];
		const b = steps[swapIdx];
		// swap step_numbers
		await locals.supabase.from('sop_steps').update({ step_number: b.step_number }).eq('id', a.id);
		await locals.supabase.from('sop_steps').update({ step_number: a.step_number }).eq('id', b.id);

		await audit(locals, 'sop.step_updated', 'sop', params.id, { step_id: stepId, moved: dir });
		return { success: true };
	},

	uploadStepPhoto: async ({ request, params, locals }) => {
		const form = await request.formData();
		const stepId = form.get('step_id')?.toString();
		const label = form.get('label')?.toString().trim();
		const file = form.get('file');
		if (!stepId) return fail(400, { message: 'Missing step id' });
		if (!(file instanceof File) || file.size === 0)
			return fail(400, { message: 'No file provided' });
		if (!file.type.startsWith('image/'))
			return fail(400, { message: 'Only image files can be uploaded' });

		const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
		const path = `sops/${params.id}/${stepId}/${Date.now()}.${ext}`;

		const { error: uploadErr } = await locals.supabase.storage
			.from('attachments')
			.upload(path, file, { contentType: file.type });
		if (uploadErr) return fail(500, { message: uploadErr.message });

		const {
			data: { publicUrl }
		} = locals.supabase.storage.from('attachments').getPublicUrl(path);

		const { data: step } = await locals.supabase
			.from('sop_steps')
			.select('attachments')
			.eq('id', stepId)
			.single();
		if (!step) return fail(404, { message: 'Step not found' });

		const attachments: Attachment[] = Array.isArray(step.attachments) ? step.attachments : [];
		attachments.push({ type: 'image', url: publicUrl, ...(label ? { label } : {}) });

		const { error: err } = await locals.supabase
			.from('sop_steps')
			.update({ attachments })
			.eq('id', stepId);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'sop.step_updated', 'sop', params.id, { step_id: stepId, uploaded_photo: path });
		return { success: true };
	},

	addAttachment: async ({ request, params, locals }) => {
		const form = await request.formData();
		const stepId = form.get('step_id')?.toString();
		const type = form.get('type')?.toString() as Attachment['type'] | undefined;
		const url = form.get('url')?.toString().trim();
		const label = form.get('label')?.toString().trim();
		if (!stepId) return fail(400, { message: 'Missing step id' });
		if (!type || !['image', 'video', 'pdf', 'link'].includes(type))
			return fail(400, { message: 'Invalid attachment type' });
		if (!url) return fail(400, { message: 'Attachment URL is required' });

		const { data: step } = await locals.supabase
			.from('sop_steps')
			.select('attachments')
			.eq('id', stepId)
			.single();
		if (!step) return fail(404, { message: 'Step not found' });

		const attachments: Attachment[] = Array.isArray(step.attachments) ? step.attachments : [];
		attachments.push({ type, url, ...(label ? { label } : {}) });

		const { error: err } = await locals.supabase
			.from('sop_steps')
			.update({ attachments })
			.eq('id', stepId);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'sop.step_updated', 'sop', params.id, { step_id: stepId, added_attachment: type });
		return { success: true };
	},

	removeAttachment: async ({ request, params, locals }) => {
		const form = await request.formData();
		const stepId = form.get('step_id')?.toString();
		const index = Number(form.get('index'));
		if (!stepId) return fail(400, { message: 'Missing step id' });
		if (!Number.isInteger(index)) return fail(400, { message: 'Invalid attachment index' });

		const { data: step } = await locals.supabase
			.from('sop_steps')
			.select('attachments')
			.eq('id', stepId)
			.single();
		if (!step) return fail(404, { message: 'Step not found' });

		const attachments: Attachment[] = Array.isArray(step.attachments) ? step.attachments : [];
		if (index < 0 || index >= attachments.length)
			return fail(400, { message: 'Attachment index out of range' });
		attachments.splice(index, 1);

		const { error: err } = await locals.supabase
			.from('sop_steps')
			.update({ attachments })
			.eq('id', stepId);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'sop.step_updated', 'sop', params.id, { step_id: stepId, removed_attachment: index });
		return { success: true };
	}
};

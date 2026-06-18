import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: unansweredQuestions, error: uqError } = await locals.supabase
		.from('unanswered_questions')
		.select('*')
		.order('created_at', { ascending: false });

	if (uqError) {
		console.error('Error fetching unanswered questions:', uqError);
	}

	const { data: qnaKnowledgeBase, error: qnaError } = await locals.supabase
		.from('qna_knowledge_base')
		.select('*')
		.order('created_at', { ascending: false });

	if (qnaError) {
		console.error('Error fetching qna knowledge base:', qnaError);
	}

	return {
		unansweredQuestions: unansweredQuestions || [],
		qnaKnowledgeBase: qnaKnowledgeBase || []
	};
};

export const actions: Actions = {
	resolve: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const questionText = data.get('question_text')?.toString();
		const answerText = data.get('answer_text')?.toString();

		if (!id || !questionText || !answerText) {
			return fail(400, { message: 'Answer is required.' });
		}

		// 1. Insert into Knowledge Base
		const { error: insertError } = await locals.supabase
			.from('qna_knowledge_base')
			.insert({ question_text: questionText, answer_text: answerText });

		if (insertError) {
			console.error('Failed to add answer to Knowledge Base:', insertError);
			return fail(500, { message: 'Failed to add answer to Knowledge Base.' });
		}

		// 2. Delete from Unanswered Questions
		const { error: deleteError } = await locals.supabase
			.from('unanswered_questions')
			.delete()
			.eq('id', id);

		if (deleteError) {
			console.error('Failed to clear unanswered question:', deleteError);
		}

		await audit(locals, 'question.resolved', 'qna_knowledge_base', id, { question: questionText });
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();

		if (!id) return fail(400, { message: 'ID required.' });

		const { error } = await locals.supabase
			.from('qna_knowledge_base')
			.delete()
			.eq('id', id);

		if (error) {
			console.error('Failed to delete knowledge entry:', error);
			return fail(500, { message: 'Failed to delete knowledge base entry.' });
		}

		await audit(locals, 'knowledge_base.deleted', 'qna_knowledge_base', id);
		return { success: true };
	}
};

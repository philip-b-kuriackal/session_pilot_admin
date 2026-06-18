<script lang="ts">
  import { enhance } from '$app/forms';
  import { confirmSubmit } from '$lib/admin/ux';

  let { data, form } = $props();

  let unansweredQuestions = $derived(data.unansweredQuestions || []);
  let qnaKnowledgeBase = $state(data.qnaKnowledgeBase || []);
  let searchQuery = $state('');

  // Sync state
  $effect(() => {
    qnaKnowledgeBase = data.qnaKnowledgeBase || [];
  });

  // Filter local knowledge base entries based on search
  const filteredKnowledgeBase = $derived(
    qnaKnowledgeBase.filter(entry => 
      entry.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.answer_text.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  let resolvingId = $state<string | null>(null);
</script>

<div class="page-head">
  <div>
    <h1>Employee Questions</h1>
    <p>Train your AI Assistant. When employees ask questions the AI cannot resolve, they appear here. Answer them to permanently add them to the AI's Knowledge Base.</p>
  </div>
</div>

<div class="card" style="margin-bottom: 2rem;">
  <h2>Unanswered Questions ({unansweredQuestions.length})</h2>
  <p class="muted" style="margin-bottom: 1.5rem;">Review the questions submitted by employees during their shifts and provide answers.</p>

  {#if unansweredQuestions.length === 0}
    <div class="empty">No pending questions! The AI knows everything. 🎉</div>
  {:else}
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      {#each unansweredQuestions as q (q.id)}
        <div style="background: #fafafa; border-radius: 12px; padding: 1.25rem; border-left: 4px solid #f07122; border: 1px solid #e2e8f0; border-left: 4px solid #f07122;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <div>
              <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em;">Asked by {q.employee_name || 'an employee'}</div>
              <h3 style="margin: 0.25rem 0 0 0; font-size: 1.1rem; font-weight: 600; color: #0f172a;">"{q.question_text}"</h3>
            </div>
            <span class="badge gray">{new Date(q.created_at).toLocaleDateString()}</span>
          </div>

          <form 
            method="POST" 
            action="?/resolve" 
            use:enhance={() => {
              resolvingId = q.id;
              return async ({ update }) => {
                await update();
                resolvingId = null;
              };
            }}
          >
            <input type="hidden" name="id" value={q.id} />
            <input type="hidden" name="question_text" value={q.question_text} />
            
            <label class="field" style="margin-bottom: 1rem;">
              <span>Your Answer</span>
              <textarea name="answer_text" rows="3" required placeholder="Type the correct answer so the AI learns it for next time..."></textarea>
            </label>
            
            <button class="btn primary" type="submit" disabled={resolvingId === q.id}>
              {resolvingId === q.id ? 'Saving...' : 'Add to Knowledge Base'}
            </button>
          </form>
        </div>
      {/each}
    </div>
  {/if}
</div>

<div class="card">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
    <h2>Knowledge Base History</h2>
    <input 
      type="text" 
      placeholder="Search QA history..." 
      bind:value={searchQuery}
      style="padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #cbd5e1; width: 100%; max-width: 300px; font-size: 0.9rem;" 
    />
  </div>

  {#if filteredKnowledgeBase.length === 0}
    <div class="empty">No entries found.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Question</th>
            <th>Answer</th>
            <th style="width: 100px;"></th>
          </tr>
        </thead>
        <tbody>
          {#each filteredKnowledgeBase as entry (entry.id)}
            <tr>
              <td class="font-semibold" style="width: 40%; vertical-align: top; padding: 1rem;">
                Q: {entry.question_text}
              </td>
              <td class="muted" style="vertical-align: top; padding: 1rem; line-height: 1.5;">
                <strong>A:</strong> {entry.answer_text}
              </td>
              <td style="vertical-align: top; text-align: right; padding: 1rem;">
                <form 
                  method="POST" 
                  action="?/delete" 
                  use:enhance 
                  onsubmit={confirmSubmit('Delete this entry from the AI Knowledge Base?')}
                >
                  <input type="hidden" name="id" value={entry.id} />
                  <button class="btn sm danger" type="submit">Delete</button>
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

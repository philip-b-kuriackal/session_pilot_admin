<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();

  const tabLabels: Record<string, string> = {
    submitted: 'Submitted',
    overdue: 'Overdue',
    rejected: 'Rejected',
    approved: 'Approved'
  };

  const statusBadge: Record<string, string> = {
    submitted: 'blue',
    overdue: 'red',
    rejected: 'red',
    approved: 'green',
    pending: 'gray',
    in_progress: 'yellow'
  };

  const priorityBadge: Record<string, string> = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    critical: 'red'
  };

  function fmtDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="page-head">
  <div>
    <h1>Approvals</h1>
    <p>Review submitted tasks, inspect evidence, and approve or reject completed work.</p>
  </div>
</div>

{#if form?.message}<div class="alert error">{form.message}</div>{/if}

<div class="filters">
  {#each data.tabs as t}
    <a class="btn {t === data.status ? 'primary' : ''}" href="?status={t}">{tabLabels[t]}</a>
  {/each}
</div>

{#if data.items.length === 0}
  <div class="card"><div class="empty">No {tabLabels[data.status].toLowerCase()} tasks.</div></div>
{/if}

{#each data.items as it (it.id)}
  <div class="card">
    <div class="appr-head">
      <div class="appr-title">
        <span class="task-name">{it.template?.name ?? 'Task'}</span>
        {#if it.template?.location?.name}
          <span class="badge gray">{it.template.location.name}</span>
        {/if}
        {#if it.template?.priority}
          <span class="badge {priorityBadge[it.template.priority] ?? 'gray'}">{it.template.priority}</span>
        {/if}
        <span class="badge {statusBadge[it.status] ?? 'gray'}">{it.status}</span>
      </div>
      <div class="appr-meta muted">
        <div>Due {fmtDate(it.due_at)}</div>
        {#if it.submitted_by}
          <div>By {it.submitter_name} · {fmtDate(it.submitted_at)}</div>
        {/if}
      </div>
    </div>

    {#if it.assignees.length}
      <div class="muted assigned">Assigned to: {it.assignees.map((a: any) => a.name).join(', ')}</div>
    {/if}

    {#if it.completions.length}
      <ul class="checklist">
        {#each it.completions as c (c.id)}
          <li>
            <span class="check {c.completed ? 'done' : ''}">{c.completed ? '✓' : '○'}</span>
            <span class="label">{c.label}</span>
            {#if c.completed_by_name}<span class="muted by">— {c.completed_by_name}</span>{/if}
            {#if c.comment}<div class="muted comment">{c.comment}</div>{/if}
          </li>
        {/each}
      </ul>
    {/if}

    {#if it.evidence.length}
      <div class="evidence-grid">
        {#each it.evidence as e (e.id)}
          {#if e.kind === 'note'}
            <blockquote class="ev-note">{e.note}</blockquote>
          {:else if e.kind === 'photo' && e.url}
            <a href={e.url} target="_blank" rel="noopener">
              <img class="ev-thumb" src={e.url} alt="evidence" />
            </a>
          {:else if e.url}
            <a class="btn sm ev-link" href={e.url} target="_blank" rel="noopener">
              {e.kind === 'video' ? '▶ Video' : 'View file'}
            </a>
          {:else}
            <span class="muted">{e.kind} (unavailable)</span>
          {/if}
        {/each}
      </div>
    {/if}

    {#if it.status === 'submitted'}
      <div class="appr-footer">
        <form method="POST" action="?/approve" use:enhance>
          <input type="hidden" name="id" value={it.id} />
          <button class="btn green" type="submit">Approve</button>
        </form>
        <form method="POST" action="?/reject" class="reject-form" use:enhance>
          <input type="hidden" name="id" value={it.id} />
          <input type="text" name="reason" placeholder="Reason for rejection" required />
          <button class="btn danger" type="submit">Reject</button>
        </form>
      </div>
    {/if}
  </div>
{/each}

<style>
  .appr-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .appr-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .task-name {
    font-weight: 700;
    font-size: 1rem;
  }
  .appr-meta {
    text-align: right;
    line-height: 1.4;
  }
  .assigned {
    margin-top: 0.5rem;
  }
  .checklist {
    list-style: none;
    margin: 0.9rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
  .checklist li {
    font-size: 0.88rem;
  }
  .check {
    display: inline-block;
    width: 1.1rem;
    color: #9ca3af;
    font-weight: 700;
  }
  .check.done {
    color: #16a34a;
  }
  .label {
    font-weight: 500;
  }
  .by {
    margin-left: 0.3rem;
  }
  .comment {
    margin: 0.15rem 0 0 1.1rem;
    font-style: italic;
  }
  .evidence-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    margin-top: 0.9rem;
  }
  .ev-thumb {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 10px;
    border: 1px solid var(--color-border);
    display: block;
  }
  .ev-note {
    margin: 0;
    max-width: 280px;
    padding: 0.6rem 0.8rem;
    background: #f6f7f9;
    border-left: 3px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.85rem;
    font-style: italic;
    color: var(--color-text-muted);
  }
  .ev-link {
    align-self: flex-start;
  }
  .appr-footer {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
    margin-top: 1.1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
  }
  .reject-form {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .reject-form input[type='text'] {
    width: 220px;
  }
</style>

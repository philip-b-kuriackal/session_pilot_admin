<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();

  let showSop = $state(false);
  let comments = $state<Record<string, string>>({});

  let isLocked = $derived(['submitted', 'approved', 'completed'].includes(data.instance.status));
  let needsApproval = $derived(data.instance.template?.requires_approval ?? false);
  let doneIds = $derived(new Set(data.completions.map((c: { checklist_item_id: string }) => c.checklist_item_id)));
  let doneCount = $derived(data.items.filter((i: { id: string }) => doneIds.has(i.id)).length);
  let progress = $derived(data.items.length ? Math.round((doneCount / data.items.length) * 100) : 0);

  const statusInfo: Record<string, { label: string; cls: string }> = {
    pending: { label: 'To do', cls: 'gray' },
    in_progress: { label: 'In progress', cls: 'blue' },
    submitted: { label: 'Awaiting approval', cls: 'purple' },
    approved: { label: 'Approved ✓', cls: 'green' },
    completed: { label: 'Done ✓', cls: 'green' },
    rejected: { label: 'Returned for correction', cls: 'red' },
    overdue: { label: 'Overdue', cls: 'red' }
  };

  function fmtDue(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }
</script>

<div class="page-container">
  <header class="header">
    <a href="/schedule" class="back-button" aria-label="Back">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"></path>
      </svg>
    </a>
    <span class="header-title">Task</span>
  </header>

  <main class="scrollable-content hide-scrollbar">
    <div class="task-hero">
      <span class="status-pill {statusInfo[data.instance.status]?.cls}">{statusInfo[data.instance.status]?.label}</span>
      <h1>{data.instance.template?.name}</h1>
      {#if data.instance.template?.description}
        <p class="desc">{data.instance.template.description}</p>
      {/if}
      <div class="meta-row">
        <span>📍 {data.instance.template?.location?.name ?? 'All locations'}</span>
        <span>⏰ Due {fmtDue(data.instance.due_at)}</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width: {progress}%"></div></div>
      <div class="progress-label">{doneCount}/{data.items.length} steps done</div>
    </div>

    {#if data.instance.status === 'rejected' && data.lastApproval}
      <div class="reject-card">
        <strong>Returned by your manager</strong>
        <p>{data.lastApproval.reason ?? 'Please review and resubmit.'}</p>
      </div>
    {/if}

    {#if form?.message}
      <div class="error-card">{form.message}</div>
    {/if}

    {#if data.steps.length > 0}
      <button class="sop-toggle" onclick={() => (showSop = !showSop)}>
        <span>📖 How to do this — {data.instance.template?.sop?.name}</span>
        <span class="chev" class:open={showSop}>▾</span>
      </button>
      {#if showSop}
        <div class="sop-steps">
          {#each data.steps as s}
            <div class="sop-step">
              <div class="step-num">{s.step_number}</div>
              <div class="step-body">
                <div class="step-title">{s.title}</div>
                {#if s.description}<div class="step-desc">{s.description}</div>{/if}
                {#if (s.attachments ?? []).length > 0}
                  <div class="step-attachments">
                    {#each s.attachments as a}
                      {#if a.type === 'image'}
                        <img src={a.url} alt={a.label ?? 'Attachment'} />
                      {:else}
                        <a href={a.url} target="_blank" rel="noreferrer">🔗 {a.label ?? a.type}</a>
                      {/if}
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}

    <div class="section-title">Checklist</div>
    <div class="checklist">
      {#each data.items as item}
        {@const done = doneIds.has(item.id)}
        <div class="check-item" class:done>
          <form method="POST" action="?/toggleItem" use:enhance>
            <input type="hidden" name="item_id" value={item.id} />
            <input type="hidden" name="done" value={(!done).toString()} />
            <input type="hidden" name="comment" value={comments[item.id] ?? ''} />
            <button class="check-box" type="submit" disabled={isLocked} aria-label="Toggle {item.label}">
              {#if done}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
              {/if}
            </button>
          </form>
          <div class="check-body">
            <div class="check-label">
              {item.label}
              {#if item.mandatory}<span class="req">*</span>{/if}
              {#if item.requires_evidence}<span class="cam">📸</span>{/if}
            </div>
            {#if !done && !isLocked}
              <input
                class="comment-input"
                type="text"
                placeholder="Add a comment (optional)…"
                bind:value={comments[item.id]}
              />
            {:else}
              {@const completion = data.completions.find((c: { checklist_item_id: string }) => c.checklist_item_id === item.id)}
              {#if completion?.comment}<div class="check-comment">“{completion.comment}”</div>{/if}
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <div class="section-title">
      Evidence
      {#if data.instance.template?.requires_evidence}<span class="req">* required</span>{/if}
    </div>

    {#if data.evidence.length > 0}
      <div class="evidence-grid">
        {#each data.evidence as e}
          <div class="evidence-item">
            {#if e.kind === 'photo' && e.url}
              <a href={e.url} target="_blank" rel="noreferrer"><img src={e.url} alt="Evidence" /></a>
            {:else if e.kind === 'note'}
              <div class="evidence-note">“{e.note}”</div>
            {:else if e.url}
              <a href={e.url} target="_blank" rel="noreferrer" class="evidence-file">📎 {e.kind}</a>
            {:else}
              <div class="evidence-file">📎 {e.kind}</div>
            {/if}
            {#if !isLocked}
              <form method="POST" action="?/deleteEvidence" use:enhance>
                <input type="hidden" name="id" value={e.id} />
                <button class="evidence-del" type="submit" aria-label="Remove evidence">×</button>
              </form>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    {#if !isLocked}
      <form method="POST" action="?/uploadEvidence" use:enhance enctype="multipart/form-data" class="evidence-form">
        <label class="photo-btn">
          <input type="file" name="file" accept="image/*,video/*" capture="environment" onchange={(e) => (e.currentTarget as HTMLInputElement).form?.requestSubmit()} />
          📸 Add photo
        </label>
        <div class="note-row">
          <input type="text" name="note" placeholder="…or write a note (e.g. fridge at 3°C)" />
          <button type="submit" class="note-add">Add</button>
        </div>
      </form>
    {/if}

    {#if !isLocked}
      <form method="POST" action="?/submit" use:enhance>
        <button class="submit-btn" type="submit">{needsApproval ? 'Submit for approval' : 'Mark as done'}</button>
      </form>
    {:else if data.instance.status === 'submitted'}
      <div class="locked-note">Submitted — waiting for your manager to review. ✅</div>
    {:else if data.instance.status === 'approved'}
      <div class="locked-note approved">Approved — great work! 🎉</div>
    {:else if data.instance.status === 'completed'}
      <div class="locked-note approved">Done — great work! 🎉</div>
    {/if}

    <div class="bottom-spacer"></div>
  </main>
</div>

<style>
  .page-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    background: var(--color-background);
  }

  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    padding-top: max(14px, env(safe-area-inset-top));
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  .back-button { color: var(--color-text); display: flex; }
  .header-title { font-weight: 700; font-size: 1rem; }

  .scrollable-content { flex: 1; overflow-y: auto; padding: 16px; }

  .task-hero {
    background: linear-gradient(135deg, #fff7f0, #fcece0);
    border: 1px solid #fbe0cc;
    border-radius: 18px;
    padding: 18px;
  }

  .status-pill {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 800;
    border-radius: 999px;
    padding: 4px 10px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .status-pill.gray { background: #f2f3f5; color: #555; }
  .status-pill.blue { background: #dbeafe; color: #1d4ed8; }
  .status-pill.purple { background: #ede9fe; color: #6b21a8; }
  .status-pill.green { background: #dcfce7; color: #15803d; }
  .status-pill.red { background: #fee2e2; color: #b91c1c; }

  .task-hero h1 {
    font-size: 1.35rem;
    font-weight: 800;
    margin: 10px 0 4px;
    letter-spacing: -0.3px;
  }

  .desc { font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 8px; }

  .meta-row {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: var(--color-text-muted);
    margin: 8px 0 12px;
  }

  .progress-track { background: rgba(240, 113, 34, 0.15); height: 8px; border-radius: 999px; overflow: hidden; }
  .progress-fill { background: var(--color-primary); height: 100%; border-radius: 999px; transition: width 0.3s; }
  .progress-label { font-size: 0.72rem; font-weight: 700; color: #e66a20; margin-top: 6px; }

  .reject-card {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    border-radius: 14px;
    padding: 14px;
    margin-top: 14px;
    font-size: 0.86rem;
  }

  .reject-card p { margin-top: 4px; }

  .error-card {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    border-radius: 12px;
    padding: 12px;
    margin-top: 14px;
    font-size: 0.85rem;
  }

  .sop-toggle {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    padding: 14px;
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 600;
    margin-top: 14px;
    cursor: pointer;
    text-align: left;
  }

  .chev { transition: transform 0.2s; }
  .chev.open { transform: rotate(180deg); }

  .sop-steps {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-top: none;
    border-radius: 0 0 14px 14px;
    margin-top: -10px;
    padding: 16px 14px 10px;
  }

  .sop-step { display: flex; gap: 12px; margin-bottom: 14px; }

  .step-num {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
    font-size: 0.78rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .step-title { font-weight: 700; font-size: 0.88rem; }
  .step-desc { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 2px; }

  .step-attachments { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
  .step-attachments img { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; }
  .step-attachments a { font-size: 0.78rem; color: #1d4ed8; }

  .section-title {
    font-size: 0.74rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
    margin: 20px 0 10px;
  }

  .req { color: #dc2626; font-weight: 800; }
  .cam { margin-left: 4px; }

  .checklist {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    overflow: hidden;
  }

  .check-item {
    display: flex;
    gap: 12px;
    padding: 13px 14px;
    border-bottom: 1px solid #f3f4f6;
    align-items: flex-start;
  }

  .check-item:last-child { border-bottom: none; }
  .check-item.done .check-label { text-decoration: line-through; color: var(--color-text-muted); }

  .check-box {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    border: 2px solid #d1d5db;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0;
  }

  .check-item.done .check-box {
    background: #22c55e;
    border-color: #22c55e;
  }

  .check-box:disabled { opacity: 0.7; cursor: default; }

  .check-body { flex: 1; min-width: 0; }
  .check-label { font-size: 0.9rem; font-weight: 600; }

  .comment-input {
    width: 100%;
    border: none;
    border-bottom: 1px dashed var(--color-border);
    font-size: 0.78rem;
    font-family: inherit;
    padding: 4px 0;
    margin-top: 4px;
    outline: none;
    background: transparent;
  }

  .check-comment { font-size: 0.78rem; color: var(--color-text-muted); font-style: italic; margin-top: 2px; }

  .evidence-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }

  .evidence-item { position: relative; }

  .evidence-item img {
    width: 92px;
    height: 92px;
    object-fit: cover;
    border-radius: 12px;
    border: 1px solid var(--color-border);
  }

  .evidence-note {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 0.8rem;
    font-style: italic;
    color: var(--color-text-muted);
    max-width: 220px;
  }

  .evidence-file {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 0.8rem;
    display: inline-block;
  }

  .evidence-del {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #1f2937;
    color: white;
    border: 2px solid white;
    font-size: 0.85rem;
    line-height: 1;
    cursor: pointer;
  }

  .evidence-form { display: flex; flex-direction: column; gap: 10px; }

  .photo-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: var(--color-surface);
    border: 2px dashed #fbb98a;
    color: #e66a20;
    border-radius: 14px;
    padding: 14px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
  }

  .photo-btn input { display: none; }

  .note-row { display: flex; gap: 8px; }

  .note-row input {
    flex: 1;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 0.85rem;
    font-family: inherit;
    outline: none;
  }

  .note-add {
    background: #1f2937;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 0 16px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
  }

  .submit-btn {
    width: 100%;
    margin-top: 20px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 14px;
    padding: 15px;
    font-size: 1rem;
    font-weight: 800;
    font-family: inherit;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(240, 113, 34, 0.35);
  }

  .submit-btn:active { transform: scale(0.99); }

  .locked-note {
    margin-top: 20px;
    text-align: center;
    background: #ede9fe;
    color: #6b21a8;
    border-radius: 14px;
    padding: 14px;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .locked-note.approved { background: #dcfce7; color: #15803d; }

  .bottom-spacer { height: 40px; }
</style>

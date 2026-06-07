<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();

  let editingStep = $state<string | null>(null);

  let sop = $derived(data.sop);
  let steps = $derived(sop.sop_steps ?? []);
</script>

<div class="page-head">
  <div>
    <a class="muted" href="/admin/sops">← All SOPs</a>
    <h1>{sop.name}</h1>
    <p>Edit SOP details and build out its steps.</p>
  </div>
</div>

{#if form?.message}
  <div class="alert error">{form.message}</div>
{/if}

<!-- SOP details -->
<div class="card">
  <h2>SOP details</h2>
  <form method="POST" action="?/update" use:enhance>
    <div class="form-grid">
      <label class="field"><span>Name *</span><input type="text" name="name" value={sop.name} required /></label>
      <label class="field"><span>Category</span><input type="text" name="category" value={sop.category ?? ''} /></label>
      <label class="field">
        <span>Department</span>
        <select name="department_id">
          <option value="">— none —</option>
          {#each data.departments as d}<option value={d.id} selected={d.id === sop.department_id}>{d.name}</option>{/each}
        </select>
      </label>
      <label class="field full"><span>Description</span><textarea name="description">{sop.description ?? ''}</textarea></label>
    </div>
    <div class="form-actions">
      <button class="btn primary" type="submit">Save</button>
    </div>
  </form>
</div>

<!-- Steps -->
<div class="card">
  <h2>Steps ({steps.length})</h2>

  {#if steps.length === 0}
    <p class="empty">No steps yet. Add the first step below.</p>
  {/if}

  <div class="step-list">
    {#each steps as step, i (step.id)}
      <div class="step-card">
        <div class="step-head">
          <div class="step-meta">
            <span class="badge orange">Step {step.step_number}</span>
            <strong>{step.title}</strong>
          </div>
          <div class="row-flex">
            <form method="POST" action="?/moveStep" use:enhance>
              <input type="hidden" name="step_id" value={step.id} />
              <input type="hidden" name="dir" value="up" />
              <button class="btn sm" type="submit" disabled={i === 0} title="Move up">↑</button>
            </form>
            <form method="POST" action="?/moveStep" use:enhance>
              <input type="hidden" name="step_id" value={step.id} />
              <input type="hidden" name="dir" value="down" />
              <button class="btn sm" type="submit" disabled={i === steps.length - 1} title="Move down">↓</button>
            </form>
            <button class="btn sm" onclick={() => (editingStep = editingStep === step.id ? null : step.id)}>
              {editingStep === step.id ? 'Close' : 'Edit'}
            </button>
            <form method="POST" action="?/deleteStep" use:enhance onsubmit={(e) => { if (!confirm(`Delete step ${step.step_number}?`)) e.preventDefault(); }}>
              <input type="hidden" name="step_id" value={step.id} />
              <button class="btn sm danger" type="submit">Delete</button>
            </form>
          </div>
        </div>

        {#if step.description}
          <p class="step-desc">{step.description}</p>
        {/if}

        {#if step.attachments?.length}
          <div class="attach-row">
            {#each step.attachments as att}
              {#if att.type === 'image'}
                <a class="attach-thumb" href={att.url} target="_blank" rel="noreferrer" title={att.label || 'Open full size'}>
                  <img src={att.url} alt={att.label ?? 'attachment'} />
                </a>
              {:else}
                <div class="attach-chip">
                  <span class="badge gray">{att.type}</span>
                  <a href={att.url} target="_blank" rel="noreferrer">{att.label || att.url}</a>
                </div>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- Quick photo upload (no edit mode needed) -->
        <form class="photo-upload" method="POST" action="?/uploadStepPhoto" enctype="multipart/form-data" use:enhance>
          <input type="hidden" name="step_id" value={step.id} />
          <label class="photo-upload-btn">
            <span>📷 Add photo</span>
            <input
              type="file"
              name="file"
              accept="image/*"
              onchange={(e) => (e.currentTarget as HTMLInputElement).form?.requestSubmit()}
            />
          </label>
        </form>

        {#if editingStep === step.id}
          <div class="step-edit">
            <!-- Edit title/description -->
            <form method="POST" action="?/updateStep" use:enhance={() => async ({ update }) => { await update({ reset: false }); }}>
              <input type="hidden" name="step_id" value={step.id} />
              <div class="form-grid">
                <label class="field full"><span>Title *</span><input type="text" name="title" value={step.title} required /></label>
                <label class="field full"><span>Description</span><textarea name="description">{step.description ?? ''}</textarea></label>
              </div>
              <div class="form-actions">
                <button class="btn primary" type="submit">Save step</button>
              </div>
            </form>

            <!-- Attachments management -->
            <div class="attach-manage">
              <span class="field-label">Attachments</span>
              {#if step.attachments?.length}
                <div class="attach-list">
                  {#each step.attachments as att, idx}
                    <div class="attach-manage-row">
                      <span class="badge gray">{att.type}</span>
                      <span class="muted attach-url">{att.label || att.url}</span>
                      <form method="POST" action="?/removeAttachment" use:enhance>
                        <input type="hidden" name="step_id" value={step.id} />
                        <input type="hidden" name="index" value={idx} />
                        <button class="btn sm danger" type="submit">Remove</button>
                      </form>
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="muted">No attachments.</p>
              {/if}

              <form method="POST" action="?/addAttachment" use:enhance>
                <input type="hidden" name="step_id" value={step.id} />
                <div class="form-grid">
                  <label class="field">
                    <span>Type</span>
                    <select name="type">
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="link">Link</option>
                    </select>
                  </label>
                  <label class="field"><span>URL *</span><input type="url" name="url" required placeholder="https://…" /></label>
                  <label class="field"><span>Label</span><input type="text" name="label" placeholder="optional" /></label>
                </div>
                <div class="form-actions">
                  <button class="btn sm" type="submit">Add attachment</button>
                </div>
              </form>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<!-- Add step -->
<div class="card">
  <h2>Add step</h2>
  <form method="POST" action="?/addStep" use:enhance>
    <div class="form-grid">
      <label class="field full"><span>Title *</span><input type="text" name="title" required placeholder="e.g. Sanitize prep surfaces" /></label>
      <label class="field full"><span>Description</span><textarea name="description"></textarea></label>
    </div>
    <div class="form-actions">
      <button class="btn primary" type="submit">Add step</button>
    </div>
  </form>
</div>

<style>
  .step-list { display: flex; flex-direction: column; gap: 0.9rem; }
  .step-card {
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 0.9rem 1rem;
    background: #fff;
  }
  .step-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .step-meta { display: flex; align-items: center; gap: 0.6rem; }
  .step-desc { margin-top: 0.5rem; font-size: 0.86rem; color: var(--color-text); white-space: pre-wrap; }
  .attach-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.6rem; }
  .attach-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.25rem 0.5rem;
    font-size: 0.78rem;
  }
  .attach-chip img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 6px;
  }
  .attach-chip a { color: #1d4ed8; text-decoration: none; word-break: break-all; }
  .attach-thumb {
    display: inline-block;
    line-height: 0;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--color-border);
  }
  .attach-thumb img {
    width: 96px;
    height: 96px;
    object-fit: cover;
    display: block;
    transition: opacity 0.12s;
  }
  .attach-thumb:hover img { opacity: 0.85; }
  .photo-upload { margin-top: 0.6rem; }
  .photo-upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 1px dashed var(--color-border);
    border-radius: 8px;
    padding: 0.35rem 0.7rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    background: #fafafa;
    transition: border-color 0.12s, color 0.12s, background 0.12s;
  }
  .photo-upload-btn:hover {
    border-color: #b8f45a;
    color: #3e6b00;
    background: #fff7f1;
  }
  .photo-upload-btn input[type='file'] {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .step-edit {
    margin-top: 0.9rem;
    padding-top: 0.9rem;
    border-top: 1px dashed var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .attach-manage { display: flex; flex-direction: column; gap: 0.6rem; }
  .field-label { font-size: 0.74rem; font-weight: 700; }
  .attach-list { display: flex; flex-direction: column; gap: 0.4rem; }
  .attach-manage-row { display: flex; align-items: center; gap: 0.6rem; }
  .attach-url { word-break: break-all; }
</style>

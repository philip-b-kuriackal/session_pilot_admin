<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();

  const t = data.template;
  const cfg = (t.recurrence_config ?? {}) as Record<string, any>;

  let recurrence = $state<string>(t.recurrence);
  let assignmentMode = $state<string>(t.assignment_mode);
  let priority = $state<string>(t.priority);
  let requiresEvidence = $state<boolean>(t.requires_evidence);
  let requiresApproval = $state<boolean>(t.requires_approval);

  const weekdayLabels = [
    [1, 'Mon'],
    [2, 'Tue'],
    [3, 'Wed'],
    [4, 'Thu'],
    [5, 'Fri'],
    [6, 'Sat'],
    [7, 'Sun']
  ] as const;

  const recurrenceOptions = [
    ['once', 'Once'],
    ['daily', 'Daily'],
    ['weekly', 'Weekly'],
    ['monthly', 'Monthly'],
    ['custom', 'Custom']
  ] as const;

  const priorityOptions = [
    ['low', 'Low'],
    ['medium', 'Medium'],
    ['high', 'High'],
    ['critical', 'Critical']
  ] as const;

  const assignmentOptions = [
    ['location', 'Everyone at location'],
    ['job_role', 'By job role'],
    ['individual', 'Specific people']
  ] as const;

  const initialWeekdays: number[] = Array.isArray(cfg.weekdays) ? cfg.weekdays : [];

  // people not already assigned, for the add-person select
  const assignedIds = new Set((t.task_template_assignees ?? []).map((a: any) => a.user_id));
  const availablePeople = $derived(data.profiles.filter((p: any) => !assignedIds.has(p.id)));
</script>

<div class="page-head">
  <div>
    <a class="btn sm" href="/admin/tasks">← All tasks</a>
    <h1 style="margin-top:0.5rem;">Edit task</h1>
    <p>{t.name}</p>
  </div>
</div>

{#if form?.message}<div class="alert error">{form.message}</div>{/if}
{#if form?.success}<div class="alert success">Saved.</div>{/if}

<form method="POST" action="?/update" class="task-form" use:enhance>
  <!-- ① What -->
  <section class="card">
    <div class="sec-head">
      <h2>What</h2>
      <p>Name the task and link any context that helps the team.</p>
    </div>
    <div class="stack">
      <label class="field"><span>Task name *</span>
        <input type="text" name="name" required value={t.name} />
      </label>
      <label class="field"><span>Description</span>
        <textarea name="description">{t.description ?? ''}</textarea>
      </label>
      <div class="two-col">
        <label class="field"><span>Location</span>
          <select name="location_id">
            <option value="">All locations</option>
            {#each data.locations as l}<option value={l.id} selected={l.id === t.location_id}>{l.name}</option>{/each}
          </select>
        </label>
        <label class="field"><span>Department</span>
          <select name="department_id">
            <option value="">— none —</option>
            {#each data.departments as d}<option value={d.id} selected={d.id === t.department_id}>{d.name}</option>{/each}
          </select>
        </label>
      </div>
      <label class="field"><span>Attach how-to guide (SOP)</span>
        <select name="sop_id">
          <option value="">— none —</option>
          {#each data.sops as s}<option value={s.id} selected={s.id === t.sop_id}>{s.name}</option>{/each}
        </select>
      </label>
      <div class="field">
        <span>Priority</span>
        <div class="pills">
          {#each priorityOptions as [val, lbl]}
            <button type="button" class="pill" class:active={priority === val} onclick={() => (priority = val)}>{lbl}</button>
          {/each}
        </div>
        <input type="hidden" name="priority" value={priority} />
      </div>
    </div>
  </section>

  <!-- ② When -->
  <section class="card">
    <div class="sec-head">
      <h2>When</h2>
      <p>How often the task repeats and the time it’s due.</p>
    </div>
    <div class="stack">
      <div class="field">
        <span>Recurrence</span>
        <div class="pills">
          {#each recurrenceOptions as [val, lbl]}
            <button type="button" class="pill" class:active={recurrence === val} onclick={() => (recurrence = val)}>{lbl}</button>
          {/each}
        </div>
        <input type="hidden" name="recurrence" value={recurrence} />
      </div>

      {#if recurrence === 'once'}
        <label class="field"><span>Date</span><input type="date" name="rc_date" value={cfg.date ?? ''} /></label>
      {:else if recurrence === 'weekly'}
        <div class="field">
          <span>Weekdays</span>
          <div class="weekday-row">
            {#each weekdayLabels as [val, lbl]}
              <label class="weekday-chip">
                <input type="checkbox" name="rc_weekdays" value={val} checked={initialWeekdays.includes(val)} />
                <span>{lbl}</span>
              </label>
            {/each}
          </div>
        </div>
      {:else if recurrence === 'monthly'}
        <label class="field"><span>Day of month</span><input type="number" name="rc_day_of_month" min="1" max="31" value={cfg.day_of_month ?? 1} /></label>
      {:else if recurrence === 'custom'}
        <div class="two-col">
          <label class="field"><span>Every N days</span><input type="number" name="rc_every_n_days" min="1" value={cfg.every_n_days ?? 1} /></label>
          <label class="field"><span>Start date</span><input type="date" name="rc_start_date" value={cfg.start_date ?? ''} /></label>
        </div>
      {/if}

      <label class="field due"><span>Deadline (time it must be done by)</span><input type="time" name="due_time" value={(t.due_time ?? '17:00').slice(0, 5)} /></label>
    </div>
  </section>

  <!-- ③ Who -->
  <section class="card">
    <div class="sec-head">
      <h2>Who</h2>
      <p>Decide who this task gets assigned to when generated.</p>
    </div>
    <div class="stack">
      <div class="field">
        <span>Assignment</span>
        <div class="pills">
          {#each assignmentOptions as [val, lbl]}
            <button type="button" class="pill" class:active={assignmentMode === val} onclick={() => (assignmentMode = val)}>{lbl}</button>
          {/each}
        </div>
        <input type="hidden" name="assignment_mode" value={assignmentMode} />
      </div>

      {#if assignmentMode === 'job_role'}
        <label class="field"><span>Job role</span>
          <select name="assigned_job_role_id">
            <option value="">— select —</option>
            {#each data.jobRoles as j}<option value={j.id} selected={j.id === t.assigned_job_role_id}>{j.name}</option>{/each}
          </select>
        </label>
      {:else if assignmentMode === 'individual'}
        <div class="muted">Manage assigned people below.</div>
      {:else}
        <div class="muted">Assigned to everyone at the location.</div>
      {/if}
    </div>
  </section>

  <!-- ④ Verification -->
  <section class="card">
    <div class="sec-head">
      <h2>Verification</h2>
      <p>Control what’s required to finish the task.</p>
    </div>
    <div class="stack">
      <div class="toggle-row">
        <label class="switch">
          <input type="checkbox" name="requires_evidence" bind:checked={requiresEvidence} />
          <span class="slider"></span>
        </label>
        <div class="toggle-text">
          <strong>Requires photo / evidence</strong>
          <span class="muted">Employees must attach proof to complete the task.</span>
        </div>
      </div>
      {#if requiresEvidence}
        <label class="field evidence-kind"><span>Evidence kind</span>
          <select name="evidence_kind">
            <option value="photo" selected={t.evidence_kind === 'photo'}>Photo</option>
            <option value="video" selected={t.evidence_kind === 'video'}>Video</option>
            <option value="file" selected={t.evidence_kind === 'file'}>File</option>
            <option value="note" selected={t.evidence_kind === 'note'}>Note</option>
          </select>
        </label>
      {/if}

      <div class="toggle-row">
        <label class="switch">
          <input type="checkbox" name="requires_approval" bind:checked={requiresApproval} />
          <span class="slider"></span>
        </label>
        <div class="toggle-text">
          <strong>Requires manager approval</strong>
          <span class="muted">Off: the task completes as soon as the employee marks it done. On: it goes to Approvals for review.</span>
        </div>
      </div>
    </div>
  </section>

  <div class="footer-bar">
    <a class="btn" href="/admin/tasks">Cancel</a>
    <button class="btn primary" type="submit">Save changes</button>
  </div>
</form>

<!-- ===================== Checklist items ===================== -->
<div class="card after-form">
  <h2>Checklist items ({t.checklist_items?.length ?? 0})</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Label</th><th>Mandatory</th><th>Photo</th><th></th></tr>
      </thead>
      <tbody>
        {#each t.checklist_items ?? [] as item}
          <tr>
            <td>{item.label}</td>
            <td><span class="badge {item.mandatory ? 'orange' : 'gray'}">{item.mandatory ? 'yes' : 'no'}</span></td>
            <td><span class="badge {item.requires_evidence ? 'purple' : 'gray'}">{item.requires_evidence ? 'yes' : 'no'}</span></td>
            <td>
              <form method="POST" action="?/delete_item" use:enhance onsubmit={(e) => { if (!confirm('Delete this item?')) e.preventDefault(); }}>
                <input type="hidden" name="item_id" value={item.id} />
                <button class="btn sm danger" type="submit">Delete</button>
              </form>
            </td>
          </tr>
        {:else}
          <tr><td colspan="4" class="empty">No checklist items yet.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>

  <form method="POST" action="?/add_item" use:enhance style="margin-top:1rem;">
    <div class="add-item">
      <input type="text" name="label" required placeholder="e.g. Wipe down surfaces" />
      <label class="checkbox-row"><input type="checkbox" name="mandatory" checked /> Mandatory</label>
      <label class="checkbox-row"><input type="checkbox" name="requires_evidence" /> Photo</label>
      <button class="btn" type="submit">+ Add</button>
    </div>
  </form>
</div>

<!-- ===================== Individual assignees ===================== -->
{#if assignmentMode === 'individual'}
  <div class="card after-form">
    <h2>Assigned people ({t.task_template_assignees?.length ?? 0})</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Name</th><th></th></tr>
        </thead>
        <tbody>
          {#each t.task_template_assignees ?? [] as a}
            <tr>
              <td>{a.profile?.first_name} {a.profile?.last_name}</td>
              <td>
                <form method="POST" action="?/remove_assignee" use:enhance>
                  <input type="hidden" name="user_id" value={a.user_id} />
                  <button class="btn sm danger" type="submit">Remove</button>
                </form>
              </td>
            </tr>
          {:else}
            <tr><td colspan="2" class="empty">No people assigned yet.</td></tr>
          {/each}
        </tbody>
      </table>
    </div>

    <form method="POST" action="?/add_assignee" use:enhance style="margin-top:1rem;">
      <div class="filters">
        <select name="user_id">
          <option value="">— select person —</option>
          {#each availablePeople as p}<option value={p.id}>{p.first_name} {p.last_name}</option>{/each}
        </select>
        <button class="btn" type="submit">+ Add person</button>
      </div>
    </form>
  </div>
{/if}

<!-- ===================== Danger zone ===================== -->
<div class="card after-form danger-zone">
  <h2>Delete task</h2>
  <p class="muted">Permanently removes this template, its checklist, and assignees. This cannot be undone.</p>
  <form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm(`Delete “${t.name}”? This cannot be undone.`)) e.preventDefault(); }}>
    <button class="btn danger" type="submit">Delete task</button>
  </form>
</div>

<style>
  .task-form {
    max-width: 720px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .after-form {
    max-width: 720px;
    width: 100%;
  }
  .sec-head {
    margin-bottom: 1rem;
  }
  .sec-head h2 {
    margin-bottom: 0.15rem;
  }
  .sec-head p {
    color: var(--color-text-muted);
    font-size: 0.82rem;
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .due {
    max-width: 200px;
  }

  /* pills */
  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .pill {
    border: 1px solid var(--color-border);
    background: #fff;
    color: var(--color-text);
    border-radius: 999px;
    padding: 0.4rem 0.9rem;
    font-size: 0.82rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
  }
  .pill:hover {
    background: #f7f7f7;
  }
  .pill.active {
    background: #ccfc7e;
    border-color: #b8f45a;
    color: #182700;
  }

  /* weekdays */
  .weekday-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .weekday-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.35rem 0.6rem;
    font-size: 0.8rem;
    cursor: pointer;
  }

  /* toggles */
  .toggle-row {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
  }
  .toggle-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .toggle-text strong {
    font-size: 0.88rem;
  }
  .evidence-kind {
    max-width: 220px;
    margin-left: 3.4rem;
  }

  /* add checklist item inline */
  .add-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .add-item input[type='text'] {
    flex: 1;
    min-width: 200px;
  }

  /* sticky footer */
  .footer-bar {
    position: sticky;
    bottom: 0;
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    background: #fff;
    border: 1px solid var(--color-border);
    border-radius: 14px;
    padding: 0.85rem 1.25rem;
  }

  .danger-zone {
    border-color: #fecaca;
  }
  .danger-zone p {
    margin-bottom: 0.9rem;
  }

  @media (max-width: 560px) {
    .two-col {
      grid-template-columns: 1fr;
    }
  }
</style>

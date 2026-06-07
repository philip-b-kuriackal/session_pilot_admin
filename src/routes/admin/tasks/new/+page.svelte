<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();

  let recurrence = $state('daily');
  let assignmentMode = $state('location');
  let priority = $state('medium');
  let requiresEvidence = $state(false);
  let requiresApproval = $state(false);

  // checklist editor
  type ChecklistRow = { label: string; mandatory: boolean; requires_evidence: boolean };
  let checklist = $state<ChecklistRow[]>([]);
  function addRow() {
    checklist.push({ label: '', mandatory: true, requires_evidence: false });
  }
  function removeRow(i: number) {
    checklist.splice(i, 1);
  }
  const checklistJson = $derived(JSON.stringify(checklist.filter((r) => r.label.trim())));

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
</script>

<div class="page-head">
  <div>
    <a class="btn sm" href="/admin/tasks">← All tasks</a>
    <h1 style="margin-top:0.5rem;">New task</h1>
  </div>
</div>

{#if form?.message}<div class="alert error">{form.message}</div>{/if}

<form method="POST" action="?/create" class="task-form" use:enhance>
  <!-- ① What -->
  <section class="card">
    <div class="sec-head">
      <h2>What</h2>
      <p>Name the task and link any context that helps the team.</p>
    </div>
    <div class="stack">
      <label class="field"><span>Task name *</span>
        <input type="text" name="name" required placeholder="e.g. Close kitchen checklist" />
      </label>
      <label class="field"><span>Description</span>
        <textarea name="description" placeholder="Short description (optional)"></textarea>
      </label>
      <div class="two-col">
        <label class="field"><span>Location</span>
          <select name="location_id">
            <option value="">All locations</option>
            {#each data.locations as l}<option value={l.id}>{l.name}</option>{/each}
          </select>
        </label>
        <label class="field"><span>Department</span>
          <select name="department_id">
            <option value="">— none —</option>
            {#each data.departments as d}<option value={d.id}>{d.name}</option>{/each}
          </select>
        </label>
      </div>
      <label class="field"><span>Attach how-to guide (SOP)</span>
        <select name="sop_id">
          <option value="">— none —</option>
          {#each data.sops as s}<option value={s.id}>{s.name}</option>{/each}
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
        <label class="field"><span>Date</span><input type="date" name="rc_date" /></label>
      {:else if recurrence === 'weekly'}
        <div class="field">
          <span>Weekdays</span>
          <div class="weekday-row">
            {#each weekdayLabels as [val, lbl]}
              <label class="weekday-chip">
                <input type="checkbox" name="rc_weekdays" value={val} />
                <span>{lbl}</span>
              </label>
            {/each}
          </div>
        </div>
      {:else if recurrence === 'monthly'}
        <label class="field"><span>Day of month</span><input type="number" name="rc_day_of_month" min="1" max="31" value="1" /></label>
      {:else if recurrence === 'custom'}
        <div class="two-col">
          <label class="field"><span>Every N days</span><input type="number" name="rc_every_n_days" min="1" value="1" /></label>
          <label class="field"><span>Start date</span><input type="date" name="rc_start_date" /></label>
        </div>
      {/if}

      <label class="field due"><span>Deadline (time it must be done by)</span><input type="time" name="due_time" value="17:00" /></label>
    </div>
  </section>

  <!-- ③ Checklist -->
  <section class="card">
    <div class="sec-head">
      <h2>Checklist</h2>
      <p>Steps the employee ticks off. Mark which are mandatory or need a photo.</p>
    </div>
    <div class="stack">
      {#each checklist as row, i}
        <div class="checklist-row">
          <input type="text" placeholder="Item label" bind:value={row.label} />
          <label class="checkbox-row"><input type="checkbox" bind:checked={row.mandatory} /> Mandatory</label>
          <label class="checkbox-row"><input type="checkbox" bind:checked={row.requires_evidence} /> Photo</label>
          <button class="btn sm danger" type="button" onclick={() => removeRow(i)}>Remove</button>
        </div>
      {/each}
      {#if checklist.length === 0}<div class="muted">No checklist items yet.</div>{/if}
      <div>
        <button class="btn sm" type="button" onclick={addRow}>+ Add item</button>
      </div>
    </div>
    <input type="hidden" name="checklist" value={checklistJson} />
  </section>

  <!-- ④ Who -->
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
            {#each data.jobRoles as j}<option value={j.id}>{j.name}</option>{/each}
          </select>
        </label>
      {:else if assignmentMode === 'individual'}
        <div class="field">
          <span>Employees</span>
          <div class="people-list">
            {#each data.profiles as p}
              <label class="checkbox-row">
                <input type="checkbox" name="assignee_ids" value={p.id} />
                {p.first_name} {p.last_name}
              </label>
            {/each}
            {#if data.profiles.length === 0}<div class="muted">No employees yet.</div>{/if}
          </div>
        </div>
      {:else}
        <div class="muted">Assigned to everyone at the location.</div>
      {/if}
    </div>
  </section>

  <!-- ⑤ Verification -->
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
            <option value="photo">Photo</option>
            <option value="video">Video</option>
            <option value="file">File</option>
            <option value="note">Note</option>
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

  <!-- Sticky footer -->
  <div class="footer-bar">
    <a class="btn" href="/admin/tasks">Cancel</a>
    <button class="btn primary" type="submit">Create task</button>
  </div>
</form>

<style>
  .task-form {
    max-width: 720px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
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

  /* checklist */
  .checklist-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .checklist-row input[type='text'] {
    flex: 1;
    min-width: 180px;
  }

  /* people */
  .people-list {
    max-height: 220px;
    overflow-y: auto;
    border: 1px solid var(--color-border);
    border-radius: 9px;
    padding: 0.5rem 0.7rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
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

  @media (max-width: 560px) {
    .two-col {
      grid-template-columns: 1fr;
    }
  }
</style>

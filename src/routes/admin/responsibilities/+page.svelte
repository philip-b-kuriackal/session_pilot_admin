<script lang="ts">
  import { enhance } from '$app/forms';
  import { confirmSubmit } from '$lib/admin/ux';
  let { data, form } = $props();
  let editing = $state<string | null>(null);
  let createOpen = $state(false);

  const priorities = ['low', 'medium', 'high', 'critical'];
  const priorityBadge: Record<string, string> = {
    critical: 'red',
    high: 'orange',
    medium: 'gray',
    low: 'gray'
  };
</script>

<div class="page-head">
  <div>
    <h1>Responsibilities</h1>
    <p>Reusable duties that can be attached to task templates. Group them by department and set an expected effort.</p>
  </div>
</div>

<details class="create-panel" bind:open={createOpen}>
  <summary>+ Add responsibility</summary>
  <div class="panel-body">
    <form method="POST" action="?/create" use:enhance>
      <div class="form-grid">
        <label class="field"><span>Name *</span><input type="text" name="name" required placeholder="e.g. Close down the bar" /></label>
        <label class="field">
          <span>Scope</span>
          <select name="location_id">
            <option value="">Universal — all restaurants</option>
            {#each data.locations as l}<option value={l.id}>{l.name}</option>{/each}
          </select>
        </label>
        <label class="field">
          <span>Department</span>
          <select name="department_id">
            <option value="">— none —</option>
            {#each data.departments as d}<option value={d.id}>{d.name}</option>{/each}
          </select>
        </label>
        <label class="field"><span>Estimated minutes</span><input type="number" name="estimated_minutes" min="0" placeholder="e.g. 30" /></label>
        <label class="field">
          <span>Priority</span>
          <select name="priority">
            {#each priorities as p}<option value={p} selected={p === 'medium'}>{p}</option>{/each}
          </select>
        </label>
        <label class="field full"><span>Description</span><textarea name="description"></textarea></label>
      </div>
      <div class="form-actions">
        <button class="btn primary" type="submit">Create responsibility</button>
      </div>
    </form>
  </div>
</details>

<div class="card">
  <h2>All responsibilities ({data.responsibilities.length})</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Name</th><th>Scope</th><th>Department</th><th>Est. time</th><th>Priority</th><th></th></tr>
      </thead>
      <tbody>
        {#each data.responsibilities as r}
          <tr>
            <td class="font-semibold">{r.name}</td>
            <td>
              {#if r.location_id}
                <span class="badge orange">{r.location?.name ?? 'Restaurant'}</span>
              {:else}
                <span class="badge gray">Universal</span>
              {/if}
            </td>
            <td>{r.department?.name ?? '—'}</td>
            <td>{r.estimated_minutes != null ? `${r.estimated_minutes} min` : '—'}</td>
            <td><span class="badge {priorityBadge[r.priority] ?? 'gray'}">{r.priority}</span></td>
            <td>
              <div class="row-flex">
                <button class="btn sm" onclick={() => (editing = editing === r.id ? null : r.id)}>
                  {editing === r.id ? 'Close' : 'Edit'}
                </button>
                <form method="POST" action="?/delete" use:enhance onsubmit={confirmSubmit(`Delete ${r.name}?`)}>
                  <input type="hidden" name="id" value={r.id} />
                  <button class="btn sm danger" type="submit">Delete</button>
                </form>
              </div>
            </td>
          </tr>
          {#if editing === r.id}
            <tr>
              <td colspan="6" style="background:#fafafa;">
                <form method="POST" action="?/update" use:enhance={() => async ({ update }) => { editing = null; await update(); }}>
                  <input type="hidden" name="id" value={r.id} />
                  <div class="form-grid">
                    <label class="field"><span>Name *</span><input type="text" name="name" value={r.name} required /></label>
                    <label class="field">
                      <span>Scope</span>
                      <select name="location_id">
                        <option value="" selected={!r.location_id}>Universal — all restaurants</option>
                        {#each data.locations as l}<option value={l.id} selected={l.id === r.location_id}>{l.name}</option>{/each}
                      </select>
                    </label>
                    <label class="field">
                      <span>Department</span>
                      <select name="department_id">
                        <option value="">— none —</option>
                        {#each data.departments as d}<option value={d.id} selected={d.id === r.department_id}>{d.name}</option>{/each}
                      </select>
                    </label>
                    <label class="field"><span>Estimated minutes</span><input type="number" name="estimated_minutes" min="0" value={r.estimated_minutes ?? ''} /></label>
                    <label class="field">
                      <span>Priority</span>
                      <select name="priority">
                        {#each priorities as p}<option value={p} selected={p === r.priority}>{p}</option>{/each}
                      </select>
                    </label>
                    <label class="field full"><span>Description</span><textarea name="description">{r.description ?? ''}</textarea></label>
                  </div>
                  <div class="form-actions">
                    <button class="btn primary" type="submit">Save changes</button>
                  </div>
                </form>
              </td>
            </tr>
          {/if}
        {:else}
          <tr><td colspan="6" class="empty">No responsibilities yet.<br /><button type="button" class="btn primary" onclick={() => (createOpen = true)}>+ Add responsibility</button></td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

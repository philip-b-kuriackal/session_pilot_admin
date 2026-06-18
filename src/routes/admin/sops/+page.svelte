<script lang="ts">
  import { enhance } from '$app/forms';
  import { confirmSubmit } from '$lib/admin/ux';
  let { data, form } = $props();
  let createOpen = $state(false);

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString();
  }
</script>

<div class="page-head">
  <div>
    <h1>SOPs</h1>
    <p>Standard operating procedures. Create one, then add its steps.</p>
  </div>
</div>

<details class="create-panel" bind:open={createOpen}>
  <summary>+ Add SOP</summary>
  <div class="panel-body">
    <form method="POST" action="?/create" use:enhance>
      <div class="form-grid">
        <label class="field"><span>Name *</span><input type="text" name="name" required placeholder="e.g. Opening Checklist" /></label>
        <label class="field"><span>Category</span><input type="text" name="category" placeholder="e.g. Kitchen" /></label>
        <label class="field">
          <span>Department</span>
          <select name="department_id">
            <option value="">— none —</option>
            {#each data.departments as d}<option value={d.id}>{d.name}</option>{/each}
          </select>
        </label>
        <label class="field full"><span>Description</span><textarea name="description"></textarea></label>
      </div>
      <div class="form-actions">
        <button class="btn primary" type="submit">Create SOP</button>
      </div>
    </form>
  </div>
</details>

<div class="card">
  <h2>All SOPs ({data.sops.length})</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Name</th><th>Category</th><th>Department</th><th>Steps</th><th>Created</th><th></th></tr>
      </thead>
      <tbody>
        {#each data.sops as s}
          <tr>
            <td class="font-semibold"><a href="/admin/sops/{s.id}">{s.name}</a></td>
            <td>{s.category ?? '—'}</td>
            <td>{s.department?.name ?? '—'}</td>
            <td>{s.sop_steps?.[0]?.count ?? 0}</td>
            <td class="muted">{fmtDate(s.created_at)}</td>
            <td>
              <form method="POST" action="?/delete" use:enhance onsubmit={confirmSubmit(`Delete ${s.name}?`)}>
                <input type="hidden" name="id" value={s.id} />
                <button class="btn sm danger" type="submit">Delete</button>
              </form>
            </td>
          </tr>
        {:else}
          <tr><td colspan="6" class="empty">No SOPs yet.<br /><button type="button" class="btn primary" onclick={() => (createOpen = true)}>+ Add SOP</button></td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

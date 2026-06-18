<script lang="ts">
  import { enhance } from '$app/forms';
  import { confirmSubmit } from '$lib/admin/ux';
  let { data, form } = $props();
  let editing = $state<string | null>(null);
  let createOpen = $state(false);
</script>

<div class="page-head">
  <div>
    <h1>Departments</h1>
    <p>Organize your team into departments. Staff and responsibilities can be grouped under a department.</p>
  </div>
</div>

<details class="create-panel" bind:open={createOpen}>
  <summary>+ Add department</summary>
  <div class="panel-body">
    <form method="POST" action="?/create" use:enhance>
      <div class="form-grid">
        <label class="field"><span>Department name *</span><input type="text" name="name" required placeholder="e.g. Kitchen" /></label>
      </div>
      <div class="form-actions">
        <button class="btn primary" type="submit">Create department</button>
      </div>
    </form>
  </div>
</details>

<div class="card">
  <h2>All departments ({data.departments.length})</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Name</th><th>Staff count</th><th></th></tr>
      </thead>
      <tbody>
        {#each data.departments as d}
          <tr>
            <td class="font-semibold">{d.name}</td>
            <td>{d.staff?.[0]?.count ?? 0}</td>
            <td>
              <div class="row-flex">
                <button class="btn sm" onclick={() => (editing = editing === d.id ? null : d.id)}>
                  {editing === d.id ? 'Close' : 'Edit'}
                </button>
                <form method="POST" action="?/delete" use:enhance onsubmit={confirmSubmit(`Delete ${d.name}?`)}>
                  <input type="hidden" name="id" value={d.id} />
                  <button class="btn sm danger" type="submit">Delete</button>
                </form>
              </div>
            </td>
          </tr>
          {#if editing === d.id}
            <tr>
              <td colspan="3" style="background:#fafafa;">
                <form method="POST" action="?/update" use:enhance={() => async ({ update }) => { editing = null; await update(); }}>
                  <input type="hidden" name="id" value={d.id} />
                  <div class="form-grid">
                    <label class="field"><span>Name *</span><input type="text" name="name" value={d.name} required /></label>
                  </div>
                  <div class="form-actions">
                    <button class="btn primary" type="submit">Save changes</button>
                  </div>
                </form>
              </td>
            </tr>
          {/if}
        {:else}
          <tr><td colspan="3" class="empty">No departments yet.<br /><button type="button" class="btn primary" onclick={() => (createOpen = true)}>+ Add department</button></td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

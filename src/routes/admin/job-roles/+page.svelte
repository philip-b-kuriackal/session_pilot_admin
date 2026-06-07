<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  let editing = $state<string | null>(null);

  function linkedIds(j: any): string[] {
    return (j.job_role_responsibilities ?? [])
      .map((l: any) => l.responsibility?.id)
      .filter(Boolean);
  }
</script>

<div class="page-head">
  <div>
    <h1>Job Roles</h1>
    <p>Define the job roles staff can hold. Tasks can be assigned to everyone with a given job role.</p>
  </div>
</div>

{#if form?.message}
  <div class="alert error">{form.message}</div>
{/if}

<details class="create-panel">
  <summary>+ Add job role</summary>
  <div class="panel-body">
    <form method="POST" action="?/create" use:enhance>
      <div class="form-grid">
        <label class="field"><span>Job role name *</span><input type="text" name="name" required placeholder="e.g. Line Cook" /></label>
        <label class="field">
          <span>Scope</span>
          <select name="location_id">
            <option value="">Universal — all restaurants</option>
            {#each data.locations as l}<option value={l.id}>{l.name}</option>{/each}
          </select>
        </label>
        <label class="field full"><span>Description</span><textarea name="description"></textarea></label>
        <div class="field full">
          <span>Responsibilities</span>
          <div class="resp-list">
            {#each data.responsibilities as r}
              <label class="checkbox-row"><input type="checkbox" name="responsibility_ids" value={r.id} /> {r.name}</label>
            {:else}
              <span class="muted">No responsibilities yet.</span>
            {/each}
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn primary" type="submit">Create job role</button>
      </div>
    </form>
  </div>
</details>

<div class="card">
  <h2>All job roles ({data.jobRoles.length})</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Name</th><th>Scope</th><th>Responsibilities</th><th>Description</th><th>Staff count</th><th></th></tr>
      </thead>
      <tbody>
        {#each data.jobRoles as j}
          {@const linked = linkedIds(j)}
          <tr>
            <td class="font-semibold">{j.name}</td>
            <td>
              {#if j.location_id}
                <span class="badge orange">{j.location?.name ?? 'Restaurant'}</span>
              {:else}
                <span class="badge gray">Universal</span>
              {/if}
            </td>
            <td>
              {#if j.job_role_responsibilities?.length}
                <span class="chips">
                  {#each j.job_role_responsibilities as l}
                    {#if l.responsibility}<span class="chip">{l.responsibility.name}</span>{/if}
                  {/each}
                </span>
              {:else}—{/if}
            </td>
            <td class="muted">{j.description ?? '—'}</td>
            <td>{j.staff?.[0]?.count ?? 0}</td>
            <td>
              <div class="row-flex">
                <button class="btn sm" onclick={() => (editing = editing === j.id ? null : j.id)}>
                  {editing === j.id ? 'Close' : 'Edit'}
                </button>
                <form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm(`Delete ${j.name}?`)) e.preventDefault(); }}>
                  <input type="hidden" name="id" value={j.id} />
                  <button class="btn sm danger" type="submit">Delete</button>
                </form>
              </div>
            </td>
          </tr>
          {#if editing === j.id}
            <tr>
              <td colspan="6" style="background:#fafafa;">
                <form method="POST" action="?/update" use:enhance={() => async ({ update }) => { editing = null; await update(); }}>
                  <input type="hidden" name="id" value={j.id} />
                  <div class="form-grid">
                    <label class="field"><span>Name *</span><input type="text" name="name" value={j.name} required /></label>
                    <label class="field">
                      <span>Scope</span>
                      <select name="location_id">
                        <option value="" selected={!j.location_id}>Universal — all restaurants</option>
                        {#each data.locations as l}<option value={l.id} selected={l.id === j.location_id}>{l.name}</option>{/each}
                      </select>
                    </label>
                    <label class="field full"><span>Description</span><textarea name="description">{j.description ?? ''}</textarea></label>
                    <div class="field full">
                      <span>Responsibilities</span>
                      <div class="resp-list">
                        {#each data.responsibilities as r}
                          <label class="checkbox-row"><input type="checkbox" name="responsibility_ids" value={r.id} checked={linked.includes(r.id)} /> {r.name}</label>
                        {:else}
                          <span class="muted">No responsibilities yet.</span>
                        {/each}
                      </div>
                    </div>
                  </div>
                  <div class="form-actions">
                    <button class="btn primary" type="submit">Save changes</button>
                  </div>
                </form>
              </td>
            </tr>
          {/if}
        {:else}
          <tr><td colspan="6" class="empty">No job roles yet.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .resp-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 180px;
    overflow-y: auto;
    border: 1px solid var(--color-border);
    border-radius: 9px;
    padding: 0.6rem 0.75rem;
  }
  .chips { display: inline-flex; flex-wrap: wrap; gap: 0.3rem; }
  .chip {
    display: inline-block;
    background: #f2f3f5;
    color: #555;
    border-radius: 999px;
    padding: 0.1rem 0.5rem;
    font-size: 0.72rem;
    font-weight: 600;
  }
</style>

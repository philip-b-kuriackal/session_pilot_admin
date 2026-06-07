<script lang="ts">
  import { fullName } from '$lib/types';
  let { data } = $props();

  function fmtWhen(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function shortId(id: string | null) {
    return id ? id.slice(0, 8) : '';
  }

  function fmtDetails(details: unknown) {
    if (details == null) return '';
    const s = JSON.stringify(details);
    if (s === '{}' || s === 'null') return '';
    return s.length > 80 ? s.slice(0, 80) + '…' : s;
  }

  function pageLink(p: number) {
    const params = new URLSearchParams();
    if (data.filters.q) params.set('q', data.filters.q);
    if (data.filters.actor) params.set('actor', data.filters.actor);
    if (data.filters.from) params.set('from', data.filters.from);
    if (data.filters.to) params.set('to', data.filters.to);
    params.set('page', String(p));
    return `?${params.toString()}`;
  }
</script>

<div class="page-head">
  <div>
    <h1>Audit Log</h1>
    <p>Audit logs are immutable — entries cannot be edited or deleted.</p>
  </div>
</div>

<div class="card">
  <h2>Filters</h2>
  <form method="GET" class="filters">
    <label class="field">
      <span>Action</span>
      <input type="text" name="q" value={data.filters.q} placeholder="Search action…" />
    </label>
    <label class="field">
      <span>Actor</span>
      <select name="actor">
        <option value="">All actors</option>
        {#each data.profiles as p}
          <option value={p.id} selected={p.id === data.filters.actor}>{fullName(p) || '—'}</option>
        {/each}
      </select>
    </label>
    <label class="field">
      <span>From</span>
      <input type="date" name="from" value={data.filters.from} />
    </label>
    <label class="field">
      <span>To</span>
      <input type="date" name="to" value={data.filters.to} />
    </label>
    <button class="btn primary" type="submit" style="align-self: flex-end;">Apply</button>
  </form>
</div>

<div class="card">
  <h2>Entries ({data.total})</h2>
  {#if data.logs.length === 0}
    <div class="empty">No audit entries match these filters.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>When</th><th>Who</th><th>Action</th><th>Entity</th><th>Details</th></tr>
        </thead>
        <tbody>
          {#each data.logs as a}
            <tr>
              <td class="muted">{fmtWhen(a.created_at)}</td>
              <td>{fullName(a.actor) || 'System'}</td>
              <td><span class="badge gray">{a.action}</span></td>
              <td class="muted">
                {a.entity_type ?? '—'}{#if a.entity_id} · {shortId(a.entity_id)}{/if}
              </td>
              <td><code class="muted">{fmtDetails(a.details)}</code></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="row-flex" style="justify-content: space-between; margin-top: 1rem;">
      <span class="muted">Showing {data.showingFrom}–{data.showingTo} of {data.total}</span>
      <div class="row-flex">
        {#if data.hasPrev}
          <a class="btn sm" href={pageLink(data.page - 1)}>Prev</a>
        {:else}
          <span class="btn sm" aria-disabled="true" style="opacity: 0.55;">Prev</span>
        {/if}
        {#if data.hasNext}
          <a class="btn sm" href={pageLink(data.page + 1)}>Next</a>
        {:else}
          <span class="btn sm" aria-disabled="true" style="opacity: 0.55;">Next</span>
        {/if}
      </div>
    </div>
  {/if}
</div>

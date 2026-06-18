<script lang="ts">
  import { enhance } from '$app/forms';
  import { fullName } from '$lib/types';
  import { KIND_LABELS, STATUS_LABELS, type AdminReportRow } from '$lib/reports';

  let { data } = $props();

  const kindBadge: Record<string, string> = {
    whistleblower: 'purple',
    end_of_day: 'blue',
    temperature: 'yellow',
    broken_item: 'red'
  };

  const statusBadge: Record<string, string> = {
    open: 'gray',
    in_review: 'orange',
    resolved: 'green'
  };

  let expanded = $state<Record<string, boolean>>({});
  let resolvingId = $state<string | null>(null);

  function toggle(id: string) {
    expanded[id] = !expanded[id];
  }

  function reporterName(r: AdminReportRow): string {
    if (r.is_anonymous || !r.reporter) return 'Anonymous';
    return fullName(r.reporter) || 'Anonymous';
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function bodyEntries(body: Record<string, string> | null | undefined): [string, string][] {
    return Object.entries(body ?? {}).filter(([, v]) => v != null && String(v).trim() !== '');
  }

  function labelize(key: string): string {
    const s = key.replaceAll('_', ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
</script>

<div class="page-head">
  <div>
    <h1>Incident reports</h1>
    <p>Employee-submitted reports — review, track, and resolve.</p>
  </div>
  <form method="GET" class="filters">
    <select name="status">
      <option value="">All statuses</option>
      {#each Object.entries(STATUS_LABELS) as [value, label]}
        <option {value} selected={value === data.filters.status}>{label}</option>
      {/each}
    </select>
    <select name="kind">
      <option value="">All kinds</option>
      {#each Object.entries(KIND_LABELS) as [value, label]}
        <option {value} selected={value === data.filters.kind}>{label}</option>
      {/each}
    </select>
    <button class="btn primary sm" type="submit">Apply</button>
  </form>
</div>

<div class="card">
  {#if data.reports.length === 0}
    <div class="empty">No reports yet — employee-submitted reports appear here.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width: 1.5rem;"></th>
            <th>Kind</th>
            <th>Subject</th>
            <th>From</th>
            <th>Location</th>
            <th>Submitted</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.reports as r (r.id)}
            <!-- keyboard access is provided by the chevron button inside the row -->
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
            <tr class="report-row" onclick={() => toggle(r.id)}>
              <td>
                <button
                  class="chevron"
                  type="button"
                  aria-label={expanded[r.id] ? 'Collapse report' : 'Expand report'}
                  aria-expanded={expanded[r.id] ?? false}
                  onclick={(e) => {
                    e.stopPropagation();
                    toggle(r.id);
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    style="transform: rotate({expanded[r.id] ? 90 : 0}deg); transition: transform 0.15s;"
                  >
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                </button>
              </td>
              <td><span class="badge {kindBadge[r.kind] ?? 'gray'}">{KIND_LABELS[r.kind] ?? r.kind}</span></td>
              <td class="subject">{r.subject || '—'}</td>
              <td>{reporterName(r)}</td>
              <td class="muted">{r.location?.name ?? '—'}</td>
              <td class="muted">{fmtDate(r.created_at)}</td>
              <td><span class="badge {statusBadge[r.status] ?? 'gray'}">{STATUS_LABELS[r.status] ?? r.status}</span></td>
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
              <td onclick={(e) => e.stopPropagation()}>
                <div class="row-flex actions">
                  {#if r.status === 'open'}
                    <form method="POST" action="?/setStatus" use:enhance>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="in_review" />
                      <button class="btn sm" type="submit">Start review</button>
                    </form>
                  {/if}
                  {#if r.status === 'open' || r.status === 'in_review'}
                    {#if resolvingId === r.id}
                      <form
                        method="POST"
                        action="?/setStatus"
                        class="resolve-form"
                        use:enhance={() =>
                          async ({ update }) => {
                            await update();
                            resolvingId = null;
                          }}
                      >
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="resolved" />
                        <input type="text" name="resolution_note" placeholder="Resolution note (optional)" />
                        <button class="btn primary sm" type="submit">Resolve</button>
                        <button class="btn sm" type="button" onclick={() => (resolvingId = null)}>Cancel</button>
                      </form>
                    {:else}
                      <button class="btn sm" type="button" onclick={() => (resolvingId = r.id)}>Resolve</button>
                    {/if}
                  {/if}
                </div>
              </td>
            </tr>
            {#if expanded[r.id]}
              <tr class="detail-row">
                <td colspan="8">
                  {#if bodyEntries(r.body).length === 0 && !r.resolution_note}
                    <span class="muted">No details provided.</span>
                  {:else}
                    <dl class="detail-list">
                      {#each bodyEntries(r.body) as [key, value]}
                        <div class="detail-item">
                          <dt class="muted">{labelize(key)}</dt>
                          <dd>{value === 'yes' ? '✓' : value}</dd>
                        </div>
                      {/each}
                      {#if r.resolution_note}
                        <div class="detail-item">
                          <dt class="muted">Resolution note</dt>
                          <dd>{r.resolution_note}</dd>
                        </div>
                      {/if}
                    </dl>
                  {/if}
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .report-row {
    cursor: pointer;
  }
  .chevron {
    border: none;
    background: none;
    padding: 0.1rem;
    cursor: pointer;
    color: var(--color-text-muted, #6b7280);
    display: inline-flex;
    align-items: center;
  }
  .subject {
    font-weight: 500;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .actions {
    flex-wrap: wrap;
  }
  .resolve-form {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .resolve-form input[type='text'] {
    width: 200px;
  }
  .detail-row td {
    background: #f9fafb;
  }
  .detail-list {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .detail-item {
    display: flex;
    gap: 0.75rem;
    font-size: 0.88rem;
  }
  .detail-item dt {
    min-width: 140px;
    flex-shrink: 0;
  }
  .detail-item dd {
    margin: 0;
    white-space: pre-wrap;
  }
</style>

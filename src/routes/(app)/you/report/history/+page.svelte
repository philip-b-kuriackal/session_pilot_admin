<script lang="ts">
  import { page } from '$app/stores';
  import { KIND_LABELS, STATUS_LABELS, type ReportRow } from '$lib/reports';

  let { data } = $props();
  let justSubmitted = $derived($page.url.searchParams.has('submitted'));

  const dateFmt = new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let expanded = $state<string | null>(null);
</script>

<svelte:head>
  <title>Submitted reports</title>
</svelte:head>

<div class="page-container">
  <header class="header">
    <a href="/you/report" class="back-button">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      <span class="header-title">Submitted reports</span>
    </a>
  </header>

  <main class="content">
    {#if justSubmitted}
      <div class="success-banner">✓ Report submitted</div>
    {/if}

    {#if data.reports.length === 0}
      <div class="empty-state">
        <p>No reports yet.</p>
        <p class="empty-sub">
          Reports you submit show up here. Anonymous whistleblower reports are not listed — they can't
          be traced back to you.
        </p>
        <a href="/you/report" class="empty-cta">File a report</a>
      </div>
    {:else}
      <div class="report-list">
        {#each data.reports as r (r.id)}
          {@const report = r as ReportRow}
          <button
            class="report-card"
            class:open={expanded === report.id}
            onclick={() => (expanded = expanded === report.id ? null : report.id)}
          >
            <div class="card-top">
              <span class="kind-tag {report.kind}">{KIND_LABELS[report.kind]}</span>
              <span class="status-tag {report.status}">{STATUS_LABELS[report.status]}</span>
            </div>
            <div class="card-subject">{report.subject}</div>
            <div class="card-date">{dateFmt.format(new Date(report.created_at))}</div>

            {#if expanded === report.id}
              <div class="card-body">
                {#each Object.entries(report.body ?? {}) as [key, value]}
                  {#if value && value !== 'no'}
                    <div class="body-row">
                      <span class="body-key">{key.replaceAll('_', ' ')}</span>
                      <span class="body-value">{value === 'yes' ? '✓' : value}</span>
                    </div>
                  {/if}
                {/each}
                {#if report.resolution_note}
                  <div class="resolution">
                    <strong>Resolution:</strong>
                    {report.resolution_note}
                  </div>
                {/if}
              </div>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </main>
</div>

<style>
  .page-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface);
    overflow-y: auto;
  }

  .header {
    display: flex;
    align-items: center;
    padding: 16px;
    padding-top: max(16px, env(safe-area-inset-top));
  }

  .back-button {
    display: flex;
    align-items: center;
    color: #1f2937;
    text-decoration: none;
    font-weight: 500;
  }

  .back-button svg {
    margin-right: 8px;
  }

  .header-title {
    font-size: 1rem;
    font-weight: 500;
  }

  .content {
    flex: 1;
    padding: 8px 20px 48px;
  }

  .success-banner {
    background: #dcfce7;
    color: #15803d;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .empty-state {
    text-align: center;
    padding: 48px 24px;
    color: #6b7280;
  }

  .empty-state p {
    margin: 0 0 8px;
    font-weight: 600;
  }

  .empty-sub {
    font-weight: 400 !important;
    font-size: 0.88rem;
    color: #9ca3af;
    line-height: 1.5;
  }

  .empty-cta {
    display: inline-block;
    margin-top: 16px;
    background: #111827;
    color: white;
    text-decoration: none;
    border-radius: 12px;
    padding: 12px 28px;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .report-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .report-card {
    text-align: left;
    background: #f9fafb;
    border: 1px solid #f0f1f3;
    border-radius: 14px;
    padding: 14px 16px;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.12s;
  }

  .report-card.open {
    border-color: #d1d5db;
    background: white;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .kind-tag,
  .status-tag {
    font-size: 0.7rem;
    font-weight: 700;
    border-radius: 8px;
    padding: 2px 8px;
  }

  .kind-tag.whistleblower { background: #f3e8ff; color: #9333ea; }
  .kind-tag.end_of_day { background: #e0f2fe; color: #0369a1; }
  .kind-tag.temperature { background: #fef3c7; color: #b45309; }
  .kind-tag.broken_item { background: #fce7f3; color: #db2777; }

  .status-tag.open { background: #f3f4f6; color: #4b5563; }
  .status-tag.in_review { background: #fef3c7; color: #b45309; }
  .status-tag.resolved { background: #dcfce7; color: #15803d; }

  .card-subject {
    font-size: 0.98rem;
    font-weight: 600;
    color: #111827;
  }

  .card-date {
    font-size: 0.78rem;
    color: #9ca3af;
    margin-top: 2px;
  }

  .card-body {
    margin-top: 12px;
    border-top: 1px solid #f0f1f3;
    padding-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .body-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .body-key {
    font-size: 0.72rem;
    font-weight: 600;
    color: #9ca3af;
    text-transform: capitalize;
  }

  .body-value {
    font-size: 0.88rem;
    color: #374151;
    white-space: pre-wrap;
  }

  .resolution {
    background: #f0fdf4;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 0.85rem;
    color: #166534;
  }
</style>

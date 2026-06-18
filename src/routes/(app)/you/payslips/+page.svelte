<script lang="ts">
  let { data } = $props();

  let expanded = $state<Record<string, boolean>>({});
  const toggle = (key: string) => (expanded[key] = !expanded[key]);

  function fmtHours(min: number): string {
    const h = Math.floor(Math.abs(min) / 60);
    const m = Math.abs(min) % 60;
    const sign = min < 0 ? '−' : '';
    return `${sign}${h}h ${m.toString().padStart(2, '0')}m`;
  }

  function fmtPay(p: number | null): string {
    if (p == null) return '—';
    return `${Math.round(p).toLocaleString('sv-SE')} kr`;
  }
</script>

<svelte:head>
  <title>Payslips</title>
</svelte:head>

<div class="page-container">
  <header class="header">
    <a href="/you" class="close-button">Close</a>
  </header>

  <main class="content">
    <h1 class="page-title">Payslips</h1>
    <p class="lede">Your estimated pay each month, based on the hours you clocked in and out.</p>

    {#if !data.payConfigured}
      <div class="notice">
        Your hourly rate isn't set yet, so we can only show hours — not pay. Ask your manager to add it.
      </div>
    {/if}

    {#if data.months.length === 0}
      <div class="empty-state">
        <p>No payslips yet.</p>
        <p class="empty-sub">Once you've clocked some shifts, your monthly pay summary will appear here.</p>
      </div>
    {:else}
      {#each data.months as m (m.key)}
        {@const s = m.summary}
        <section class="slip">
          <button class="slip-head" onclick={() => toggle(m.key)} aria-expanded={expanded[m.key] ?? false}>
            <div class="slip-month">
              <span class="month-label">{m.label}</span>
              <span class="month-hours">{fmtHours(s.total_minutes)} worked</span>
            </div>
            <div class="slip-pay">
              <span class="pay-amount" class:muted={s.est_pay == null}>{fmtPay(s.est_pay)}</span>
              <svg class="chev" class:open={expanded[m.key]} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </button>

          {#if expanded[m.key]}
            <div class="slip-body">
              <div class="line"><span>Hours worked</span><span>{fmtHours(s.worked_minutes)}</span></div>
              {#if s.adjustment_minutes !== 0}
                <div class="line"><span>Adjustments</span><span class:pos={s.adjustment_minutes > 0} class:neg={s.adjustment_minutes < 0}>{s.adjustment_minutes > 0 ? '+' : ''}{fmtHours(s.adjustment_minutes)}</span></div>
              {/if}
              {#if s.target_minutes != null}
                <div class="line"><span>Contract hours</span><span>{fmtHours(s.target_minutes)}</span></div>
              {/if}
              {#if s.overtime_minutes != null && s.overtime_minutes > 0}
                <div class="line"><span>Overtime</span><span class="ot">{fmtHours(s.overtime_minutes)}</span></div>
              {/if}

              {#if s.est_pay != null}
                <div class="divider"></div>
                {#if s.base_pay != null}
                  <div class="line"><span>Base pay</span><span>{fmtPay(s.base_pay)}</span></div>
                {/if}
                {#if s.overtime_pay != null && s.overtime_pay > 0}
                  <div class="line"><span>Overtime pay</span><span>{fmtPay(s.overtime_pay)}</span></div>
                {/if}
                <div class="line total"><span>Estimated gross</span><span>{fmtPay(s.est_pay)}</span></div>
              {/if}

              {#if m.adjustments.length}
                <div class="adj-notes">
                  {#each m.adjustments as a}
                    <p>{a.minutes > 0 ? '+' : ''}{fmtHours(a.minutes)} — {a.reason}</p>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </section>
      {/each}

      <p class="footnote">Estimates only. Your actual payslip is issued by payroll and may differ.</p>
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
    padding: 16px 20px;
    padding-top: max(16px, env(safe-area-inset-top));
  }

  .close-button {
    font-size: 1rem;
    color: #1f2937;
    text-decoration: none;
    font-weight: 500;
  }

  .content {
    padding: 20px;
    padding-bottom: 60px;
  }

  .page-title {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 6px 0;
    font-family: 'Outfit', var(--font-family-base);
  }

  .lede {
    color: #6b7280;
    font-size: 0.92rem;
    margin: 0 0 20px;
  }

  .notice {
    background: #fef3c7;
    color: #92400e;
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 0.85rem;
    margin-bottom: 16px;
  }

  .empty-state {
    text-align: center;
    padding: 48px 24px;
    color: #6b7280;
  }
  .empty-state p { margin: 0 0 8px; font-weight: 600; }
  .empty-sub { font-weight: 400 !important; font-size: 0.9rem; color: #9ca3af; }

  .slip {
    border: 1px solid #f0f0f0;
    border-radius: 14px;
    margin-bottom: 12px;
    overflow: hidden;
    background: var(--color-surface);
  }

  .slip-head {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f9fafb;
    border: none;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }

  .slip-month { display: flex; flex-direction: column; gap: 2px; }
  .month-label { font-size: 1rem; font-weight: 700; color: #111827; }
  .month-hours { font-size: 0.8rem; color: #6b7280; }

  .slip-pay { display: flex; align-items: center; gap: 8px; }
  .pay-amount { font-size: 1.05rem; font-weight: 800; color: var(--color-primary); white-space: nowrap; }
  .pay-amount.muted { color: #c0c0c0; }

  .chev { color: #9ca3af; transition: transform 0.15s; flex-shrink: 0; }
  .chev.open { transform: rotate(180deg); }

  .slip-body { padding: 14px 16px 16px; }

  .line {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: #374151;
    padding: 6px 0;
  }
  .line span:first-child { color: #6b7280; }
  .line .pos { color: #16a34a; font-weight: 600; }
  .line .neg { color: #dc2626; font-weight: 600; }
  .line .ot { color: var(--color-primary); font-weight: 600; }

  .line.total {
    font-weight: 800;
    color: #111827;
    font-size: 1rem;
  }
  .line.total span:first-child { color: #111827; }

  .divider { height: 1px; background: #f0f0f0; margin: 8px 0; }

  .adj-notes {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed #e5e7eb;
  }
  .adj-notes p { font-size: 0.8rem; color: #9ca3af; margin: 0 0 4px; }

  .footnote {
    margin-top: 20px;
    font-size: 0.78rem;
    color: #9ca3af;
    text-align: center;
  }
</style>

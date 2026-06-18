<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { enhance } from '$app/forms';
  import { confirmSubmit } from '$lib/admin/ux';
  let { data, form } = $props();

  let intervalId: ReturnType<typeof setInterval>;

  onMount(() => {
    // Enable Real-time updates! Poll every 2 seconds so the dashboard updates instantly
    // when the user presses Check-in, Pause, or Check-out on their mobile app.
    intervalId = setInterval(() => {
      invalidateAll();
    }, 2000);
  });

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
  });

  function fmtMinutes(mins: number): string {
    const sign = mins < 0 ? '−' : '';
    const m = Math.abs(Math.round(mins));
    const h = Math.floor(m / 60);
    const r = m % 60;
    return `${sign}${h}h ${String(r).padStart(2, '0')}m`;
  }

  function fmtAdjustment(mins: number): string {
    return (mins > 0 ? '+' : mins < 0 ? '' : '') + fmtMinutes(mins);
  }

  function fmtPay(p: number | null): string {
    if (p == null) return '—';
    return p.toLocaleString('en-GB', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  }

  function fmtDay(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function fmtTime(iso: string | null) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="no-print">
  <a href="/admin/timesheets?month={data.month}" class="back">← Back to timesheets</a>
</div>

<div class="sheet">
  <div class="page-head">
    <div>
      <h1>{data.employee.name}</h1>
      <p>
        {#if data.employee.position}{data.employee.position} · {/if}
        {#if data.employee.location}{data.employee.location} · {/if}
        {data.monthLabel}
      </p>
      <div style="margin-top:0.4rem;">
        {#if data.employee.contract_type === 'full_time'}
          <span class="badge gray">Full-time{data.employee.monthly_hours ? ` ${data.employee.monthly_hours}h` : ''}</span>
        {:else}
          <span class="badge blue">Hourly{data.employee.hourly_rate ? ` · ${data.employee.hourly_rate}/h` : ''}</span>
        {/if}
      </div>
    </div>
    <div class="row-flex no-print">
      <a class="btn primary" href="/admin/timesheets/{data.employee.id}/export?month={data.month}" download>
        📊 Download timesheet (Excel)
      </a>
      <button class="btn" type="button" onclick={() => window.print()}>🖨️ Print</button>
    </div>
  </div>

  <div class="card">
    <h2>Time entries</h2>
    {#if data.entries.length === 0}
      <div class="empty">No clock-ins recorded this month.</div>
    {:else}
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Breaks</th><th>Net hours</th></tr>
          </thead>
          <tbody>
            {#each data.entries as e}
              <tr>
                <td class="font-semibold">{fmtDay(e.clock_in)}</td>
                <td>{fmtTime(e.clock_in)}</td>
                <td>
                  {#if e.open}<span class="badge yellow">in progress</span>{:else}{fmtTime(e.clock_out)}{/if}
                </td>
                <td>{e.break_minutes > 0 ? fmtMinutes(e.break_minutes) : '—'}</td>
                <td>{e.net_minutes == null ? '—' : fmtMinutes(e.net_minutes)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if data.hasOpen}
        <p class="muted" style="margin-top:0.7rem;">In-progress entries are shown but excluded from the totals below.</p>
      {/if}
    {/if}
  </div>

  <div class="card">
    <h2>Summary</h2>
    <div class="summary-grid">
      <div><span class="lbl">Worked</span><span class="val">{fmtMinutes(data.summary.worked_minutes)}</span></div>
      <div>
        <span class="lbl">Adjustments</span>
        <span class="val" style="color: {data.summary.adjustment_minutes > 0 ? '#16a34a' : data.summary.adjustment_minutes < 0 ? '#dc2626' : 'inherit'};">
          {data.summary.adjustment_minutes === 0 ? '—' : fmtAdjustment(data.summary.adjustment_minutes)}
        </span>
      </div>
      <div><span class="lbl">Grand total</span><span class="val">{fmtMinutes(data.summary.total_minutes)}</span></div>
      {#if data.summary.target_minutes != null}
        <div><span class="lbl">Contract target</span><span class="val">{fmtMinutes(data.summary.target_minutes)}</span></div>
      {/if}
      <div>
        <span class="lbl">Overtime</span>
        <span class="val">
          {#if data.summary.overtime_minutes != null && data.summary.overtime_minutes > 0}
            <span class="badge orange">{fmtMinutes(data.summary.overtime_minutes)}</span>
          {:else}—{/if}
        </span>
      </div>
      <div><span class="lbl">Est. pay</span><span class="val">{fmtPay(data.summary.est_pay)}</span></div>
    </div>
    {#if data.summary.est_pay != null}
      <p class="muted" style="margin-top:0.7rem;">
        {#if data.employee.contract_type === 'full_time' && data.employee.monthly_hours != null}
          Base {fmtPay(data.summary.base_pay)} ({data.employee.monthly_hours}h × {data.employee.hourly_rate})
          + overtime {fmtPay(data.summary.overtime_pay)}
          ({fmtMinutes(data.summary.overtime_minutes ?? 0)} × {data.employee.hourly_rate}/h)
          = {fmtPay(data.summary.est_pay)}.
        {:else}
          {fmtMinutes(data.summary.total_minutes)} × {data.employee.hourly_rate}/h = {fmtPay(data.summary.est_pay)}.
        {/if}
      </p>
    {/if}
  </div>

  <div class="card">
    <h2>Manual adjustments</h2>
    {#if data.adjustments.length === 0}
      <div class="empty">No manual adjustments this month.</div>
    {:else}
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Added</th><th>Amount</th><th>Reason</th><th>By</th><th class="no-print"></th></tr>
          </thead>
          <tbody>
            {#each data.adjustments as a}
              <tr>
                <td class="muted">{new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td style="color: {a.minutes > 0 ? '#16a34a' : '#dc2626'}; font-weight:600;">{fmtAdjustment(a.minutes)}</td>
                <td>{a.reason}</td>
                <td>{a.created_by_name}</td>
                <td class="no-print">
                  <form method="POST" action="?/deleteAdjustment" use:enhance onsubmit={confirmSubmit('Delete this adjustment?')}>
                    <input type="hidden" name="id" value={a.id} />
                    <button class="btn sm danger" type="submit">Delete</button>
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <form method="POST" action="?/addAdjustment" use:enhance class="no-print" style="margin-top:1rem;">
      <div class="form-grid">
        <label class="field">
          <span>Type</span>
          <select name="sign">
            <option value="+">+ Add hours</option>
            <option value="-">− Reduce hours</option>
          </select>
        </label>
        <label class="field"><span>Hours</span><input type="number" name="hours" step="0.25" min="0" placeholder="e.g. 1.5" /></label>
        <label class="field full"><span>Reason *</span><input type="text" name="reason" required placeholder="e.g. reduced breaks agreed with manager" /></label>
      </div>
      <div class="form-actions">
        <button class="btn primary" type="submit">Add adjustment</button>
      </div>
      <p class="muted" style="margin-top:0.6rem;">Use for negotiated corrections — e.g. reduced breaks agreed with the manager.</p>
    </form>
  </div>
</div>

<style>
  .back { color: #3e6b00; text-decoration: none; font-weight: 600; font-size: 0.86rem; }
  .back:hover { text-decoration: underline; }
  .sheet { display: flex; flex-direction: column; gap: 1.25rem; }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }
  .summary-grid .lbl { display: block; font-size: 0.74rem; font-weight: 700; color: var(--color-text-muted); }
  .summary-grid .val { display: block; font-size: 1.2rem; font-weight: 800; margin-top: 0.2rem; }

  @media print {
    :global(.admin-sidebar), :global(.admin-topbar) { display: none !important; }
    :global(.admin-content) { padding: 0 !important; max-width: none !important; }
    .no-print { display: none !important; }
  }
</style>

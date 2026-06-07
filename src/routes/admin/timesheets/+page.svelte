<script lang="ts">
  let { data } = $props();

  /** Format whole minutes as "Hh MMm". */
  function fmtMinutes(mins: number): string {
    const sign = mins < 0 ? '−' : '';
    const m = Math.abs(Math.round(mins));
    const h = Math.floor(m / 60);
    const r = m % 60;
    return `${sign}${h}h ${String(r).padStart(2, '0')}m`;
  }

  function fmtAdjustment(mins: number): string {
    if (mins === 0) return '—';
    return (mins > 0 ? '+' : '') + fmtMinutes(mins);
  }

  function fmtPay(p: number | null): string {
    if (p == null) return '—';
    return p.toLocaleString('en-GB', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  }
</script>

<div class="page-head">
  <div>
    <h1>Timesheets</h1>
    <p>Monthly worked hours, overtime and estimated pay across your team.</p>
  </div>
</div>

<div class="card">
  <form method="GET" class="filters">
    <label class="field">
      <span>Month</span>
      <input type="month" name="month" value={data.month} />
    </label>
    <button class="btn primary" type="submit" style="align-self: flex-end;">Apply</button>
  </form>
</div>

<div class="card">
  <h2>{data.monthLabel}</h2>
  {#if data.rows.length === 0}
    <div class="empty">No employees found.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Contract</th>
            <th>Worked</th>
            <th>Adjustments</th>
            <th>Total</th>
            <th>Overtime</th>
            <th>Est. pay</th>
          </tr>
        </thead>
        <tbody>
          {#each data.rows as r}
            <tr>
              <td class="font-semibold">
                <a href="/admin/timesheets/{r.id}?month={data.month}">{r.name}</a>
                <a class="btn sm" style="margin-left:0.5rem;" href="/admin/timesheets/{r.id}/export?month={data.month}" title="Download Excel timesheet" download>📊</a>
                {#if r.status !== 'active'}<span class="badge gray" style="margin-left:0.4rem;">{r.status.replace('_', ' ')}</span>{/if}
              </td>
              <td>
                {#if r.contract_type === 'full_time'}
                  <span class="badge gray">Full-time{r.monthly_hours ? ` ${r.monthly_hours}h` : ''}</span>
                {:else}
                  <span class="badge blue">Hourly{r.hourly_rate ? ` · ${r.hourly_rate}/h` : ''}</span>
                {/if}
              </td>
              <td>{fmtMinutes(r.worked_minutes)}</td>
              <td>
                {#if r.adjustment_minutes === 0}
                  <span class="muted">—</span>
                {:else}
                  <span style="color: {r.adjustment_minutes > 0 ? '#16a34a' : '#dc2626'}; font-weight:600;">{fmtAdjustment(r.adjustment_minutes)}</span>
                {/if}
              </td>
              <td class="font-semibold">{fmtMinutes(r.total_minutes)}</td>
              <td>
                {#if r.overtime_minutes != null && r.overtime_minutes > 0}
                  <span class="badge orange">{fmtMinutes(r.overtime_minutes)}</span>
                {:else}
                  <span class="muted">—</span>
                {/if}
              </td>
              <td>{fmtPay(r.est_pay)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
  <p class="muted" style="margin-top:0.9rem;">
    Hours = check-in/check-out minus breaks, plus manual adjustments. Overtime = total beyond the monthly contract hours.
  </p>
</div>

<style>
  td a { color: #3e6b00; text-decoration: none; font-weight: 600; }
  td a:hover { text-decoration: underline; }
</style>

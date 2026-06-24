<script lang="ts">
  import { entryNetMinutes, type TimeEntry } from '$lib/types';

  let { data } = $props();

  const monthFmt = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });
  const dayFmt = new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeFmt = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false });

  function fmtMinutes(min: number): string {
    const sign = min < 0 ? '−' : '';
    let totalSeconds = Math.round(Math.abs(min) * 60);
    const h = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${sign}${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }

  function breakMinutes(e: TimeEntry): number {
    let ms = 0;
    for (const b of e.breaks ?? []) {
      const end = b.break_end ? new Date(b.break_end).getTime() : Date.now();
      ms += Math.max(0, end - new Date(b.break_start).getTime());
    }
    return ms / 60000;
  }

  // group entries by month, with totals
  let months = $derived.by(() => {
    const map = new Map<string, { label: string; entries: TimeEntry[]; total: number }>();
    for (const e of data.entries as TimeEntry[]) {
      const d = new Date(e.clock_in);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) map.set(key, { label: monthFmt.format(d), entries: [], total: 0 });
      const g = map.get(key)!;
      g.entries.push(e);
      g.total += entryNetMinutes(e);
    }
    return [...map.values()];
  });
</script>

<svelte:head>
  <title>Your hours</title>
</svelte:head>

<div class="page-container">
  <header class="header">
    <a href="/you" class="close-button">Close</a>
  </header>

  <main class="content">
    <h1 class="page-title">Your hours</h1>

    {#if months.length === 0}
      <div class="empty-state">
        <p>No worked time yet.</p>
        <p class="empty-sub">Check in from the feed when your shift starts and your hours will show up here.</p>
      </div>
    {:else}
      {#each months as month}
        <section class="month-section">
          <div class="month-head">
            <h2 class="month-title">{month.label}</h2>
            <span class="month-total">{fmtMinutes(month.total)}</span>
          </div>

          {#each month.entries as e}
            {@const breaks = breakMinutes(e)}
            <div class="entry-row">
              <div class="entry-main">
                <span class="entry-day">{dayFmt.format(new Date(e.clock_in))}</span>
                <span class="entry-times">
                  {timeFmt.format(new Date(e.clock_in))}
                  –
                  {#if e.clock_out}
                    {timeFmt.format(new Date(e.clock_out))}
                  {:else}
                    <span class="ongoing">now</span>
                  {/if}
                  {#if breaks > 0}
                    <span class="break-note">· {fmtMinutes(breaks)} break</span>
                  {/if}
                </span>
              </div>
              <span class="entry-total" class:open={!e.clock_out}>{fmtMinutes(entryNetMinutes(e))}</span>
            </div>
          {/each}
        </section>
      {/each}
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
    margin: 0 0 24px 0;
    font-family: 'Outfit', var(--font-family-base);
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
    font-size: 0.9rem;
    color: #9ca3af;
  }

  .month-section {
    margin-bottom: 28px;
  }

  .month-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 10px;
  }

  .month-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .month-total {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-primary);
  }

  .entry-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    background: #f9fafb;
    border-radius: 12px;
    margin-bottom: 8px;
  }

  .entry-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .entry-day {
    font-size: 0.92rem;
    font-weight: 600;
    color: #1f2937;
  }

  .entry-times {
    font-size: 0.8rem;
    color: #6b7280;
  }

  .ongoing {
    color: #16a34a;
    font-weight: 600;
  }

  .break-note {
    color: #9ca3af;
  }

  .entry-total {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1f2937;
    white-space: nowrap;
  }

  .entry-total.open {
    color: #16a34a;
  }
</style>

<script lang="ts">
  import { enhance } from '$app/forms';
  import QrScanner from './QrScanner.svelte';
  import type { TimeEntry } from '$lib/types';

  let { entry, qrRequired = false } = $props<{ entry: TimeEntry | null; qrRequired?: boolean }>();

  let scanning = $state(false);

  // live ticking clock
  let now = $state(Date.now());
  $effect(() => {
    const t = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(t);
  });

  let onBreak = $derived(
    !!entry && (entry.breaks ?? []).some((b: { break_end: string | null }) => !b.break_end)
  );

  /** Net worked ms = (now - in) - breaks. */
  let workedMs = $derived.by(() => {
    if (!entry) return 0;
    const start = new Date(entry.clock_in).getTime();
    let breakMs = 0;
    for (const b of entry.breaks ?? []) {
      const bs = new Date(b.break_start).getTime();
      const be = b.break_end ? new Date(b.break_end).getTime() : now;
      breakMs += Math.max(0, be - bs);
    }
    return Math.max(0, now - start - breakMs);
  });

  function fmt(ms: number): string {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }

  function sinceLabel(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  // themed check-out confirmation popup
  let showConfirm = $state(false);
</script>

<div class="clock-card" class:working={!!entry && !onBreak} class:paused={onBreak}>
  {#if !entry}
    <div class="clock-info">
      <div class="clock-state">Not checked in</div>
      <div class="clock-sub">
        {qrRequired ? '📷 Scan the restaurant QR to check in' : 'Tap to start your work day'}
      </div>
    </div>
    {#if qrRequired}
      <button class="clock-btn start" type="button" onclick={() => (scanning = true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
        Check in
      </button>
    {:else}
      <form method="POST" action="?/clockIn" use:enhance>
        <button class="clock-btn start" type="submit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Check in
        </button>
      </form>
    {/if}
  {:else}
    <div class="clock-info">
      <div class="clock-state">
        {#if onBreak}☕ On break{:else}<span class="pulse"></span> Working{/if}
        <span class="since">since {sinceLabel(entry.clock_in)}</span>
      </div>
      <div class="clock-timer">{fmt(workedMs)}</div>
    </div>
    <div class="clock-actions">
      {#if onBreak}
        <form method="POST" action="?/endBreak" use:enhance>
          <button class="icon-btn resume" type="submit" aria-label="Resume work" title="Resume">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </form>
      {:else}
        <form method="POST" action="?/startBreak" use:enhance>
          <button class="icon-btn pause" type="submit" aria-label="Take a break" title="Pause">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
          </button>
        </form>
      {/if}
      <button class="clock-btn stop" type="button" onclick={() => (showConfirm = true)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        Check out
      </button>
    </div>
  {/if}
</div>

{#if scanning}
  <QrScanner onClose={() => (scanning = false)} />
{/if}

{#if showConfirm}
  <div
    class="confirm-overlay"
    role="presentation"
    onclick={(e) => { if (e.target === e.currentTarget) showConfirm = false; }}
  >
    <div class="confirm-card" role="dialog" aria-modal="true" aria-label="Check out">
      <div class="confirm-emoji">👋</div>
      <h3>Check out?</h3>
      <p>
        This ends your work session.
        {#if entry}You've worked <strong>{fmt(workedMs).slice(0, 5)}</strong> today.{/if}
      </p>
      <div class="confirm-actions">
        <button class="confirm-btn cancel" type="button" onclick={() => (showConfirm = false)}>
          Keep working
        </button>
        <form
          method="POST"
          action="?/clockOut"
          use:enhance={() => {
            return async ({ update }) => {
              showConfirm = false;
              await update();
            };
          }}
        >
          <button class="confirm-btn confirm" type="submit">Check out</button>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .clock-card {
    margin: 12px 16px 0;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .clock-card.working {
    background: linear-gradient(135deg, #fff7f0, #fcece0);
    border-color: #fbe0cc;
  }

  .clock-card.paused {
    background: #fefce8;
    border-color: #fde68a;
  }

  .clock-info { min-width: 0; }

  .clock-state {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .since {
    font-weight: 500;
    color: var(--color-text-muted);
    font-size: 0.72rem;
  }

  .clock-sub {
    font-size: 0.74rem;
    color: var(--color-text-muted);
    margin-top: 2px;
  }

  .clock-timer {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: 0.5px;
    font-variant-numeric: tabular-nums;
    color: #1a1a1a;
    margin-top: 2px;
  }

  .pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse 1.6s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }

  .clock-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .clock-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: none;
    border-radius: 10px;
    padding: 9px 14px;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .clock-btn.start {
    background: var(--color-primary);
    color: white;
    padding: 12px 18px;
    font-size: 0.9rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(240, 113, 34, 0.3);
  }


  /* Check out — same design language as Check in, but red */
  .clock-btn.stop {
    background: #dc2626;
    color: white;
    padding: 12px 18px;
    font-size: 0.9rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }

  .clock-btn:active { transform: scale(0.98); }

  /* Icon-only pause/resume */
  .icon-btn {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  .icon-btn.pause {
    background: #fef3c7;
    color: #a16207;
    box-shadow: 0 2px 8px rgba(161, 98, 7, 0.18);
  }

  .icon-btn.resume {
    background: #dcfce7;
    color: #15803d;
    box-shadow: 0 2px 8px rgba(21, 128, 61, 0.18);
  }

  .icon-btn:active { transform: scale(0.94); }

  /* ---- Themed confirmation popup ---- */
  .confirm-overlay {
    position: absolute;
    inset: 0;
    background: rgba(17, 24, 39, 0.45);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 24px;
  }

  .confirm-card {
    width: 100%;
    max-width: 320px;
    background: var(--color-surface);
    border-radius: 20px;
    padding: 24px 20px 18px;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    animation: pop-in 0.18s ease-out;
  }

  @keyframes pop-in {
    from { opacity: 0; transform: scale(0.92) translateY(8px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .confirm-emoji { font-size: 2rem; }

  .confirm-card h3 {
    font-size: 1.15rem;
    font-weight: 800;
    margin: 8px 0 4px;
    color: var(--color-text);
  }

  .confirm-card p {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-bottom: 18px;
  }

  .confirm-card p strong { color: var(--color-text); }

  .confirm-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .confirm-actions form { display: contents; }

  .confirm-btn {
    width: 100%;
    border: none;
    border-radius: 12px;
    padding: 12px;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
  }

  .confirm-btn.confirm {
    background: #dc2626;
    color: white;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }

  .confirm-btn.cancel {
    background: var(--color-reaction-bg);
    color: var(--color-text);
  }
</style>

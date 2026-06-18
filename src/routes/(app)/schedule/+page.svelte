<script lang="ts">
  import BottomNav from '$lib/app/components/BottomNav.svelte';
  import { enhance } from '$app/forms';

  let { data } = $props();
  let tab = $state<'day' | 'events'>('day');

  const statusLabel: Record<string, string> = {
    pending: 'To do',
    in_progress: 'In progress',
    submitted: 'Awaiting approval',
    approved: 'Approved',
    completed: 'Done',
    rejected: 'Returned',
    overdue: 'Overdue'
  };

  function fmtTime(t: string) {
    return t.slice(0, 5);
  }

  function fmtDueTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  function fmtEventDate(iso: string) {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) +
      ' • ' +
      d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    );
  }

  let selectedLabel = $derived(
    new Date(data.selected + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  );
</script>

<div class="page-container">
  <div class="background-decor"></div>

  <header class="header">
    <a href="/" class="close-button">Close</a>
    <h1 class="page-title">Schedule</h1>

    <div class="tabs">
      <button class="tab" class:active={tab === 'day'} onclick={() => (tab = 'day')}>My day</button>
      <button class="tab" class:active={tab === 'events'} onclick={() => (tab = 'events')}>Events</button>
    </div>
  </header>

  <main class="content">
    <div class="events-card">
      {#if tab === 'day'}
        <!-- Day picker strip -->
        <div class="day-strip hide-scrollbar">
          {#each data.days as d}
            <a
              href="/schedule?day={d.date}"
              class="day-chip"
              class:selected={d.date === data.selected}
              data-sveltekit-noscroll
            >
              <span class="weekday">{d.weekday}</span>
              <span class="daynum">{d.dayNum}</span>
              {#if d.isToday}<span class="today-dot"></span>{/if}
            </a>
          {/each}
        </div>

        <h2 class="month-title">{selectedLabel}</h2>

        <!-- Shifts -->
        <div class="section-label">Work shifts</div>
        {#if data.shifts.length === 0}
          <div class="empty-line">No shift scheduled — enjoy your day! 🌴</div>
        {:else}
          {#each data.shifts as s}
            <div class="shift-card">
              <div class="shift-time">
                <span class="time-big">{fmtTime(s.start_time)}</span>
                <span class="time-sep">–</span>
                <span class="time-big">{fmtTime(s.end_time)}</span>
              </div>
              <div class="shift-info">
                <div class="shift-role">{s.role_label ?? 'Shift'}</div>
                <div class="shift-loc">{s.location?.name ?? ''}{s.notes ? ` · ${s.notes}` : ''}</div>
              </div>
            </div>
          {/each}
        {/if}

        <!-- Tasks -->
        <div class="section-label">Tasks</div>
        {#if data.tasks.length === 0}
          <div class="empty-line">No tasks due this day.</div>
        {:else}
          {#each data.tasks as t}
            <a href="/tasks/{t.id}" class="task-item">
              <div
                class="task-status-dot"
                class:done={['approved', 'submitted', 'completed'].includes(t.status)}
                class:alert={t.status === 'overdue' || t.status === 'rejected'}
              ></div>
              <div class="task-info">
                <div class="task-name">{t.template?.name}</div>
                <div class="task-meta">
                  Due {fmtDueTime(t.due_at)}
                  {#if t.template?.requires_evidence}· 📸 photo required{/if}
                </div>
              </div>
              <span
                class="task-badge"
                class:badge-done={t.status === 'approved' || t.status === 'completed'}
                class:badge-wait={t.status === 'submitted'}
                class:badge-alert={t.status === 'overdue' || t.status === 'rejected'}
              >
                {statusLabel[t.status] ?? t.status}
              </span>
            </a>
          {/each}
        {/if}
      {:else}
        <h2 class="month-title">Upcoming events</h2>
        {#if data.events.length === 0}
          <div class="empty-line">No upcoming events.</div>
        {/if}
        {#each data.events as e}
          <div class="event-item">
            <div class="event-image-wrapper">
              <img src={e.image_url ?? '/dummy%20image%204.jpg'} alt={e.title} class="event-image" />
            </div>

            <div class="event-details">
              <div class="event-time">{fmtEventDate(e.starts_at)}</div>
              <div class="event-name-row">
                <span class="event-name">{e.title}</span>
              </div>
              <div class="event-attendees">
                {e.joining} {e.joining === 1 ? 'person is' : 'people are'} going
              </div>
            </div>

            <form method="POST" action="?/toggleAttendance" use:enhance>
              <input type="hidden" name="event_id" value={e.id} />
              <input type="hidden" name="joining" value={(!e.isJoining).toString()} />
              <button class="join-btn" class:joined={e.isJoining} type="submit">
                {#if e.isJoining}
                  Joining
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                {:else}
                  Join
                {/if}
              </button>
            </form>
          </div>
        {/each}
      {/if}
    </div>
  </main>

  <BottomNav />
</div>

<style>
  .page-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
    overflow: hidden;
  }

  .background-decor {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 300px;
    background:
      radial-gradient(circle at 80% 10%, rgba(255, 255, 255, 0.8) 12px, transparent 13px),
      radial-gradient(circle at 90% 25%, rgba(255, 255, 255, 0.6) 18px, transparent 19px),
      radial-gradient(circle at 65% 15%, rgba(255, 255, 255, 0.5) 8px, transparent 9px);
    pointer-events: none;
    z-index: 0;
  }

  .header {
    padding: 16px 20px 0;
    padding-top: max(16px, env(safe-area-inset-top));
    position: relative;
    z-index: 1;
  }

  .close-button {
    font-size: 0.95rem;
    color: #1f2937;
    text-decoration: none;
    font-weight: 500;
  }

  .page-title {
    font-size: 2.2rem;
    font-weight: 700;
    color: #111827;
    margin: 20px 0 16px 0;
    font-family: 'Outfit', var(--font-family-base);
  }

  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .tab {
    border: none;
    background: rgba(255, 255, 255, 0.6);
    color: #4b5563;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 8px 18px;
    border-radius: 999px;
    cursor: pointer;
  }

  .tab.active {
    background: #111827;
    color: white;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
    min-height: 0;
  }

  .events-card {
    flex: 1;
    background-color: white;
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    padding: 20px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
    overflow-y: auto;
    padding-bottom: 100px;
  }

  /* Day strip */
  .day-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    margin-bottom: 16px;
  }

  .day-chip {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 52px;
    padding: 10px 0 8px;
    border-radius: 14px;
    background: #f3f4f6;
    text-decoration: none;
    position: relative;
  }

  .day-chip .weekday {
    font-size: 0.65rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
  }

  .day-chip .daynum {
    font-size: 1.05rem;
    font-weight: 700;
    color: #1f2937;
  }

  .day-chip.selected {
    background: #6b21a8;
  }

  .day-chip.selected .weekday,
  .day-chip.selected .daynum {
    color: white;
  }

  .today-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #f07122;
  }

  .month-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 16px 0;
  }

  .section-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #9ca3af;
    margin: 18px 0 10px;
  }

  .empty-line {
    font-size: 0.88rem;
    color: #6b7280;
    padding: 8px 0;
  }

  /* Shifts */
  .shift-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: linear-gradient(135deg, #f5f3ff, #ede9fe);
    border: 1px solid #e9d5ff;
    border-radius: 16px;
    padding: 14px 16px;
    margin-bottom: 10px;
  }

  .shift-time {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .time-big {
    font-size: 1.05rem;
    font-weight: 700;
    color: #6b21a8;
  }

  .time-sep {
    color: #a78bfa;
  }

  .shift-info {
    flex: 1;
  }

  .shift-role {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.95rem;
  }

  .shift-loc {
    font-size: 0.8rem;
    color: #6b7280;
  }

  /* Tasks */
  .task-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 4px;
    text-decoration: none;
    color: inherit;
    border-bottom: 1px solid #f3f4f6;
  }

  .task-status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #d1d5db;
    flex-shrink: 0;
  }

  .task-status-dot.done { background: #22c55e; }
  .task-status-dot.alert { background: #ef4444; }

  .task-info { flex: 1; min-width: 0; }

  .task-name {
    font-weight: 600;
    font-size: 0.95rem;
    color: #1f2937;
  }

  .task-meta {
    font-size: 0.78rem;
    color: #6b7280;
  }

  .task-badge {
    font-size: 0.72rem;
    font-weight: 700;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 999px;
    padding: 4px 10px;
    white-space: nowrap;
  }

  .task-badge.badge-done { background: #dcfce7; color: #15803d; }
  .task-badge.badge-wait { background: #ede9fe; color: #6b21a8; }
  .task-badge.badge-alert { background: #fee2e2; color: #b91c1c; }

  /* Events (kept from reference design) */
  .event-item {
    display: flex;
    align-items: center;
    color: inherit;
    gap: 14px;
    padding: 12px 0;
  }

  .event-image-wrapper {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .event-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .event-details {
    flex: 1;
    min-width: 0;
  }

  .event-time {
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .event-name {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .event-attendees {
    font-size: 0.85rem;
    color: #6b7280;
  }

  .join-btn {
    border: 1px solid #e9d5ff;
    background: white;
    color: #6b21a8;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    border-radius: 999px;
    padding: 6px 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .join-btn.joined {
    background: #6b21a8;
    border-color: #6b21a8;
    color: white;
  }
</style>

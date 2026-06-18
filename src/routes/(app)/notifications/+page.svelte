<script lang="ts">
  import BottomNav from '$lib/app/components/BottomNav.svelte';
  import { enhance } from '$app/forms';
  let { data } = $props();

  const kindIcon: Record<string, string> = {
    task_assigned: '📋',
    task_reminder: '⏰',
    task_overdue: '🚨',
    task_approved: '✅',
    task_rejected: '↩️',
    escalation: '⚠️',
    shift_assigned: '🗓️',
    event: '🎉',
    general: '🔔'
  };

  function fmt(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }
</script>

<div class="page-container">
  <header class="header">
    <a href="/" class="close-button">Close</a>
    <div class="title-row">
      <h1 class="page-title">Notifications</h1>
      {#if data.notifications.some((n: { read: boolean }) => !n.read)}
        <form method="POST" action="?/markAllRead" use:enhance>
          <button class="mark-all" type="submit">Mark all read</button>
        </form>
      {/if}
    </div>
  </header>

  <main class="content hide-scrollbar">
    {#if data.notifications.length === 0}
      <div class="empty">You're all caught up! 🎉</div>
    {/if}
    {#each data.notifications as n}
      <a href={n.link ?? '#'} class="notif" class:unread={!n.read}>
        <span class="notif-icon">{kindIcon[n.kind] ?? '🔔'}</span>
        <span class="notif-body">
          <span class="notif-title">{n.title}</span>
          {#if n.body}<span class="notif-text">{n.body}</span>{/if}
          <span class="notif-time">{fmt(n.created_at)}</span>
        </span>
        {#if !n.read}
          <form method="POST" action="?/markRead" use:enhance>
            <input type="hidden" name="id" value={n.id} />
            <button class="dot-btn" type="submit" aria-label="Mark read"><span class="dot"></span></button>
          </form>
        {/if}
      </a>
    {/each}
    <div class="bottom-spacer"></div>
  </main>

  <BottomNav />
</div>

<style>
  .page-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    background: var(--color-background);
  }

  .header {
    padding: 16px 20px 8px;
    padding-top: max(16px, env(safe-area-inset-top));
  }

  .close-button {
    font-size: 0.95rem;
    color: #1f2937;
    text-decoration: none;
    font-weight: 500;
  }

  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .page-title {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin: 18px 0 8px 0;
    font-family: 'Outfit', var(--font-family-base);
  }

  .mark-all {
    background: none;
    border: none;
    color: var(--color-primary);
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    margin-bottom: 14px;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 8px 16px;
  }

  .empty {
    text-align: center;
    color: var(--color-text-muted);
    padding: 60px 20px;
    font-size: 0.95rem;
  }

  .notif {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    padding: 13px 14px;
    margin-bottom: 10px;
    text-decoration: none;
    color: inherit;
  }

  .notif.unread {
    background: #fff7f0;
    border-color: #fbe0cc;
  }

  .notif-icon { font-size: 1.2rem; }

  .notif-body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .notif-title { font-weight: 700; font-size: 0.88rem; }
  .notif-text { font-size: 0.8rem; color: var(--color-text-muted); }
  .notif-time { font-size: 0.72rem; color: #9ca3af; margin-top: 2px; }

  .dot-btn { background: none; border: none; cursor: pointer; padding: 6px; }
  .dot { display: block; width: 9px; height: 9px; border-radius: 50%; background: var(--color-primary); }

  .bottom-spacer { height: 100px; }
</style>

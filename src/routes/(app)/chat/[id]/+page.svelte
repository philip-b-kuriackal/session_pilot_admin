<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';

  let { data } = $props();

  type Message = { id: string; body: string; created_at: string; sender_id: string | null };

  // live message list: server-loaded + realtime appends
  let liveMessages = $state<Message[]>([]);
  let serverIds = $derived(new Set((data.messages as Message[]).map((m) => m.id)));
  let messages = $derived([
    ...(data.messages as Message[]),
    ...liveMessages.filter((m) => !serverIds.has(m.id))
  ]);

  let body = $state('');
  let sending = $state(false);
  let scrollEl = $state<HTMLElement | null>(null);

  let others = $derived(data.conversation.members.filter((m: any) => m.profile_id !== data.me));
  let memberById = $derived(
    new Map(data.conversation.members.map((m: any) => [m.profile_id, m.profile]))
  );

  let isChannel = $derived(data.conversation.kind === 'channel');
  let title = $derived(
    isChannel
      ? (data.conversation.title ?? 'Team')
      : `${others[0]?.profile?.first_name ?? ''} ${others[0]?.profile?.last_name ?? ''}`.trim() ||
          'Conversation'
  );
  let subtitle = $derived(
    isChannel ? `${data.conversation.members.length} members` : (others[0]?.profile?.position ?? '')
  );

  function senderName(id: string | null): string {
    if (!id) return 'Unknown';
    const p = memberById.get(id) as any;
    return p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() : 'Former member';
  }

  function senderAvatar(id: string | null): string | null {
    if (!id) return null;
    return (memberById.get(id) as any)?.avatar_url ?? null;
  }

  function senderInitials(id: string | null): string {
    const p = memberById.get(id) as any;
    return `${p?.first_name?.[0] ?? ''}${p?.last_name?.[0] ?? ''}`.toUpperCase() || '?';
  }

  const timeFmt = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dayFmt = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' });

  function dayLabel(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return dayFmt.format(d);
  }

  // group consecutive messages under day separators
  let grouped = $derived.by(() => {
    const out: { day: string; items: Message[] }[] = [];
    for (const m of messages) {
      const day = dayLabel(m.created_at);
      if (out.length === 0 || out[out.length - 1].day !== day) out.push({ day, items: [] });
      out[out.length - 1].items.push(m);
    }
    return out;
  });

  function scrollToBottom(smooth = false) {
    if (!scrollEl) return;
    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }

  $effect(() => {
    void messages.length; // re-run when messages change
    requestAnimationFrame(() => scrollToBottom(true));
  });

  // realtime: append messages as they arrive
  $effect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`messages-${data.conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${data.conversation.id}`
        },
        (payload) => {
          const m = payload.new as Message;
          if (!serverIds.has(m.id) && !liveMessages.some((x) => x.id === m.id)) {
            liveMessages = [...liveMessages, m];
          }
        }
      )
      .subscribe();
    return () => {
      supabase?.removeChannel(channel);
    };
  });
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<div class="page-container">
  <header class="thread-header">
    <a href="/chat" class="back-btn" aria-label="Back to messages">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </a>
    {#if isChannel}
      <div class="header-avatar channel">👥</div>
    {:else if others[0]?.profile?.avatar_url}
      <img src={others[0].profile.avatar_url} alt="" class="header-avatar" />
    {:else}
      <div class="header-avatar placeholder">{senderInitials(others[0]?.profile_id ?? null)}</div>
    {/if}
    <div class="header-info">
      <h1>{title}</h1>
      {#if subtitle}<span class="header-sub">{subtitle}</span>{/if}
    </div>
  </header>

  <main class="messages" bind:this={scrollEl}>
    {#each grouped as group (group.day)}
      <div class="day-separator"><span>{group.day}</span></div>
      {#each group.items as m (m.id)}
        {@const mine = m.sender_id === data.me}
        <div class="message-row" class:mine>
          {#if !mine && isChannel}
            {#if senderAvatar(m.sender_id)}
              <img src={senderAvatar(m.sender_id)} alt="" class="msg-avatar" />
            {:else}
              <div class="msg-avatar placeholder">{senderInitials(m.sender_id)}</div>
            {/if}
          {/if}
          <div class="bubble" class:mine>
            {#if !mine && isChannel}
              <span class="sender">{senderName(m.sender_id)}</span>
            {/if}
            <p>{m.body}</p>
            <span class="time">{timeFmt.format(new Date(m.created_at))}</span>
          </div>
        </div>
      {/each}
    {:else}
      <div class="empty-thread">
        <p>No messages yet — say hi 👋</p>
      </div>
    {/each}
  </main>

  <form
    class="composer"
    method="POST"
    action="?/send"
    use:enhance={() => {
      sending = true;
      const sent = body;
      body = '';
      return async ({ result }) => {
        sending = false;
        if (result.type !== 'success') {
          body = sent; // restore on failure
        }
        await invalidateAll();
      };
    }}
  >
    <input
      type="text"
      name="body"
      placeholder="Message…"
      autocomplete="off"
      bind:value={body}
      maxlength="4000"
    />
    <button type="submit" aria-label="Send" disabled={sending || !body.trim()}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    </button>
  </form>
</div>

<style>
  .page-container {
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface);
  }

  .thread-header {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.85rem 1rem;
    padding-top: max(0.85rem, env(safe-area-inset-top));
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .back-btn {
    color: var(--color-text);
    display: flex;
    padding: 4px;
  }

  .header-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .header-avatar.placeholder,
  .header-avatar.channel {
    background: #fde8d7;
    color: #c2410c;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85rem;
  }

  .header-avatar.channel {
    background: #eef2ff;
    font-size: 1.1rem;
  }

  .header-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .header-info h1 {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-sub {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .day-separator {
    text-align: center;
    margin: 12px 0 8px;
  }

  .day-separator span {
    font-size: 0.72rem;
    font-weight: 600;
    color: #9ca3af;
    background: #f3f4f6;
    border-radius: 10px;
    padding: 3px 10px;
  }

  .message-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }

  .message-row.mine {
    justify-content: flex-end;
  }

  .msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .msg-avatar.placeholder {
    background: #fde8d7;
    color: #c2410c;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.65rem;
  }

  .bubble {
    max-width: 78%;
    background: #f2f3f5;
    border-radius: 16px 16px 16px 4px;
    padding: 8px 12px;
    position: relative;
  }

  .bubble.mine {
    background: var(--color-primary);
    border-radius: 16px 16px 4px 16px;
  }

  .bubble .sender {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    color: #c2410c;
    margin-bottom: 2px;
  }

  .bubble p {
    margin: 0;
    font-size: 0.92rem;
    color: var(--color-text);
    white-space: pre-wrap;
    word-break: break-word;
    padding-right: 38px;
  }

  .bubble.mine p {
    color: white;
  }

  .bubble .time {
    position: absolute;
    right: 10px;
    bottom: 6px;
    font-size: 0.62rem;
    color: #9ca3af;
  }

  .bubble.mine .time {
    color: rgba(255, 255, 255, 0.75);
  }

  .empty-thread {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    font-size: 0.92rem;
  }

  .composer {
    display: flex;
    gap: 8px;
    padding: 0.7rem 1rem;
    padding-bottom: max(0.7rem, env(safe-area-inset-bottom));
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
    background: var(--color-surface);
  }

  .composer input {
    flex: 1;
    border: none;
    background: #f2f3f5;
    border-radius: 20px;
    padding: 10px 16px;
    font-size: 0.95rem;
    font-family: inherit;
    outline: none;
  }

  .composer button {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: none;
    background: var(--color-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  .composer button:disabled {
    opacity: 0.45;
  }
</style>

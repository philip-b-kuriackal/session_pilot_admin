<script lang="ts">
  import BottomNav from '$lib/app/components/BottomNav.svelte';
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  type Member = {
    profile_id: string;
    last_read_at: string;
    profile: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      position: string | null;
    } | null;
  };
  type Conversation = {
    id: string;
    kind: 'dm' | 'channel';
    title: string | null;
    created_at: string;
    members: Member[];
    messages: { id: string; body: string; created_at: string; sender_id: string | null }[];
  };

  let searchQuery = $state('');
  let activeFilter = $state<'All' | 'Unread' | 'Groups'>('All');
  let showNewMessage = $state(false);
  let personQuery = $state('');
  let starting = $state(false);

  const name = (p: Member['profile']) =>
    `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || 'Team member';
  const initials = (p: Member['profile']) =>
    `${p?.first_name?.[0] ?? ''}${p?.last_name?.[0] ?? ''}`.toUpperCase() || '?';

  function fmtTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (d.getFullYear() === now.getFullYear())
      return d.toLocaleDateString('en', { day: 'numeric', month: 'short' });
    return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' });
  }

  // shape conversations for display
  let chats = $derived.by(() => {
    return (data.conversations as Conversation[])
      .map((c) => {
        const others = c.members.filter((m) => m.profile_id !== data.me);
        const mine = c.members.find((m) => m.profile_id === data.me);
        const last = c.messages?.[0] ?? null;
        const display =
          c.kind === 'channel' ? (c.title ?? 'Team') : name(others[0]?.profile ?? null);
        const avatar = c.kind === 'channel' ? null : (others[0]?.profile?.avatar_url ?? null);
        const unread =
          !!last &&
          last.sender_id !== data.me &&
          (!mine || new Date(last.created_at) > new Date(mine.last_read_at));
        return {
          id: c.id,
          kind: c.kind,
          display,
          avatar,
          initials: c.kind === 'channel' ? '👥' : initials(others[0]?.profile ?? null),
          lastBody: last ? (last.sender_id === data.me ? `You: ${last.body}` : last.body) : 'Say hi 👋',
          lastAt: last?.created_at ?? c.created_at,
          unread
        };
      })
      .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  });

  let visibleChats = $derived(
    chats
      .filter((c) => activeFilter !== 'Unread' || c.unread)
      .filter((c) => activeFilter !== 'Groups' || c.kind === 'channel')
      .filter((c) => !searchQuery.trim() || c.display.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  );

  let unreadCount = $derived(chats.filter((c) => c.unread).length);

  // people picker, excluding those I already have a DM with is unnecessary — server reuses DMs
  let visiblePeople = $derived(
    (data.people as { id: string; first_name: string | null; last_name: string | null; avatar_url: string | null; position: string | null }[]).filter(
      (p) =>
        !personQuery.trim() ||
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(personQuery.trim().toLowerCase())
    )
  );
</script>

<svelte:head>
  <title>Messages</title>
</svelte:head>

<div class="page-container">
  <header class="chat-header">
    <h1>Messages</h1>
    <button class="new-message-btn" aria-label="New message" onclick={() => (showNewMessage = true)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  </header>

  <main class="scrollable-content hide-scrollbar">
    <div class="search-container">
      <div class="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" placeholder="Search" bind:value={searchQuery} />
      </div>
    </div>

    <div class="filters">
      {#each ['All', 'Unread', 'Groups'] as filter (filter)}
        <button
          class="filter-pill"
          class:active={activeFilter === filter}
          onclick={() => (activeFilter = filter as typeof activeFilter)}
        >
          {filter}{filter === 'Unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
        </button>
      {/each}
    </div>

    <div class="chat-list">
      {#each visibleChats as chat (chat.id)}
        <a href="/chat/{chat.id}" class="chat-item" style="text-decoration: none;">
          {#if chat.avatar}
            <img src={chat.avatar} alt={chat.display} class="chat-avatar" />
          {:else}
            <div class="chat-avatar placeholder" class:channel={chat.kind === 'channel'}>
              {chat.initials}
            </div>
          {/if}
          <div class="chat-content">
            <div class="chat-header-row">
              <h3 class="chat-name" class:unread={chat.unread}>{chat.display}</h3>
              <span class="chat-time">{fmtTime(chat.lastAt)}</span>
            </div>
            <p class="chat-message" class:unread={chat.unread}>{chat.lastBody}</p>
          </div>
          {#if chat.unread}
            <span class="unread-dot"></span>
          {/if}
        </a>
      {:else}
        <div class="empty-chats">
          <p>No conversations{searchQuery ? ' match your search' : ' yet'}.</p>
          <button class="empty-cta" onclick={() => (showNewMessage = true)}>Start a chat</button>
        </div>
      {/each}
    </div>

    <div class="bottom-spacer"></div>
  </main>

  <BottomNav />

  {#if showNewMessage}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="popup-overlay" onclick={() => (showNewMessage = false)}>
      <div class="popup-content" onclick={(e) => e.stopPropagation()}>
        <div class="popup-header">
          <h2>New message</h2>
          <button class="icon-btn" aria-label="Close" onclick={() => (showNewMessage = false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e66420" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="search-bar in-popup">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" placeholder="Search people" bind:value={personQuery} />
        </div>

        {#if form?.message}
          <p class="popup-error">{form.message}</p>
        {/if}

        <div class="people-list hide-scrollbar">
          {#each visiblePeople as p (p.id)}
            <form
              method="POST"
              action="?/start"
              use:enhance={() => {
                starting = true;
                return async ({ update }) => {
                  starting = false;
                  await update();
                };
              }}
            >
              <input type="hidden" name="profile_id" value={p.id} />
              <button type="submit" class="person-row" disabled={starting}>
                {#if p.avatar_url}
                  <img src={p.avatar_url} alt="" class="person-avatar" />
                {:else}
                  <div class="person-avatar placeholder">
                    {`${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase() || '?'}
                  </div>
                {/if}
                <div class="person-info">
                  <span class="person-name">{`${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()}</span>
                  {#if p.position}
                    <span class="person-role">{p.position}</span>
                  {/if}
                </div>
              </button>
            </form>
          {:else}
            <p class="no-people">No people found.</p>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .page-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface);
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.25rem 0.75rem;
    padding-top: max(1.25rem, env(safe-area-inset-top));
  }

  .chat-header h1 {
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin: 0;
  }

  .new-message-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
  }

  .search-container {
    padding: 0.5rem 1.25rem;
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f2f3f5;
    border-radius: 12px;
    padding: 0.6rem 0.9rem;
    color: #9ca3af;
  }

  .search-bar input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.92rem;
    font-family: inherit;
    flex: 1;
    color: var(--color-text);
  }

  .filters {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 1.25rem 0.75rem;
  }

  .filter-pill {
    background: #f2f3f5;
    border: none;
    color: #4b5563;
    padding: 0.45rem 0.9rem;
    border-radius: 18px;
    font-size: 0.82rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
  }

  .filter-pill.active {
    background: var(--color-text);
    color: white;
  }

  .chat-list {
    display: flex;
    flex-direction: column;
  }

  .chat-item {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 0.7rem 1.25rem;
    color: inherit;
  }

  .chat-item:active {
    background: #f9fafb;
  }

  .chat-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .chat-avatar.placeholder {
    background: #fde8d7;
    color: #c2410c;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
  }

  .chat-avatar.placeholder.channel {
    background: #eef2ff;
    font-size: 1.3rem;
  }

  .chat-content {
    flex: 1;
    min-width: 0;
  }

  .chat-header-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .chat-name {
    font-size: 0.98rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-text);
  }

  .chat-name.unread {
    font-weight: 800;
  }

  .chat-time {
    font-size: 0.72rem;
    color: #9ca3af;
    white-space: nowrap;
  }

  .chat-message {
    font-size: 0.85rem;
    color: #6b7280;
    margin: 2px 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-message.unread {
    color: var(--color-text);
    font-weight: 600;
  }

  .unread-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-primary);
    flex-shrink: 0;
  }

  .empty-chats {
    text-align: center;
    padding: 56px 24px;
    color: #6b7280;
  }

  .empty-chats p {
    margin: 0 0 16px;
  }

  .empty-cta {
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 11px 26px;
    font-weight: 700;
    font-size: 0.9rem;
    font-family: inherit;
    cursor: pointer;
  }

  .bottom-spacer {
    height: 90px;
  }

  /* New message popup */
  .popup-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 200;
    display: flex;
    align-items: flex-end;
  }

  .popup-content {
    background: white;
    width: 100%;
    border-radius: 20px 20px 0 0;
    padding: 1.25rem;
    max-height: 75vh;
    display: flex;
    flex-direction: column;
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .popup-header h2 {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    padding: 4px;
  }

  .search-bar.in-popup {
    margin-bottom: 0.75rem;
  }

  .popup-error {
    color: #b91c1c;
    font-size: 0.85rem;
    margin: 0 0 8px;
  }

  .people-list {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .person-row {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.6rem 0.25rem;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    font-family: inherit;
    cursor: pointer;
    border-radius: 10px;
  }

  .person-row:hover {
    background: #f9fafb;
  }

  .person-row:disabled {
    opacity: 0.6;
  }

  .person-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .person-avatar.placeholder {
    background: #fde8d7;
    color: #c2410c;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85rem;
  }

  .person-info {
    display: flex;
    flex-direction: column;
  }

  .person-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .person-role {
    font-size: 0.78rem;
    color: #9ca3af;
  }

  .no-people {
    text-align: center;
    color: #9ca3af;
    padding: 24px;
  }
</style>

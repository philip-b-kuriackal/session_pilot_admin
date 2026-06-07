<script lang="ts">
  import { page } from '$app/stores';

  // Chat stays hidden until the admin enables it for this user's restaurant
  let chatEnabled = $derived($page.data.chatEnabled ?? false);
  let unread = $derived($page.data.unreadNotifications ?? 0);
</script>

<nav class="bottom-nav">
  <a href="/" class="nav-item" class:active={$page.url.pathname === '/'}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>
    <span>Feed</span>
  </a>

  {#if chatEnabled}
    <a href="/chat" class="nav-item" class:active={$page.url.pathname === '/chat'}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>Chat</span>
    </a>
  {/if}

  <a href="/schedule" class="nav-item" class:active={$page.url.pathname === '/schedule'}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
    <span>Schedule</span>
  </a>
  
  <a href="/hub" class="nav-item" class:active={$page.url.pathname === '/hub'}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
    <span>Hub</span>
  </a>
  
  <a href="/you" class="nav-item you-tab" class:active={$page.url.pathname === '/you'}>
    <div class="icon-wrapper">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
        <line x1="9" y1="9" x2="9.01" y2="9"></line>
        <line x1="15" y1="9" x2="15.01" y2="9"></line>
      </svg>
      {#if unread > 0}
        <span class="notification-dot">{unread}</span>
      {/if}
    </div>
    <span>You</span>
  </a>
</nav>

<style>
  .bottom-nav {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: var(--color-surface);
    display: flex;
    justify-content: space-around;
    padding: 0.75rem 0.5rem;
    border-top: 1px solid var(--color-border);
    z-index: 50;
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
  }

  .nav-item {
    background: none;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: var(--color-text-muted);
    cursor: pointer;
    width: 20%;
    text-decoration: none;
  }

  .nav-item span {
    font-size: 0.65rem;
    font-weight: 500;
  }

  .nav-item.active {
    color: var(--color-text);
  }

  .nav-item.active svg {
    stroke-width: 2.5;
  }
  
  /* Feed tab is active by default and colored */
  .nav-item.active:nth-child(1) {
    color: #4338ca; /* Indigo-ish color for feed icon in screenshot */
  }

  .icon-wrapper {
    position: relative;
    display: flex;
  }

  .notification-dot {
    position: absolute;
    top: -4px;
    right: -6px;
    background-color: #e53e3e;
    color: white;
    font-size: 0.6rem;
    font-weight: bold;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }
</style>

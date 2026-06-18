<script lang="ts">
  import { page } from '$app/stores';

  // Desktop-only navigation rail (hidden on phones — BottomNav takes over there)
  let brandName = $derived($page.data.brandName ?? 'proxie');
  let chatEnabled = $derived($page.data.chatEnabled ?? false);
  let unread = $derived($page.data.unreadNotifications ?? 0);

  const isActive = (path: string, exact = true) =>
    exact ? $page.url.pathname === path : $page.url.pathname.startsWith(path);
</script>

<aside class="side-nav">
  <a href="/" class="brand">{brandName}</a>

  <nav>
    <a href="/" class="nav-item" class:active={isActive('/')}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
      </svg>
      <span>Feed</span>
    </a>

    {#if chatEnabled}
      <a href="/chat" class="nav-item" class:active={isActive('/chat', false)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Chat</span>
      </a>
    {/if}

    <a href="/schedule" class="nav-item" class:active={isActive('/schedule', false)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <span>Schedule</span>
    </a>

    <a href="/hub" class="nav-item" class:active={isActive('/hub', false)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
      <span>Hub</span>
    </a>

    <a href="/directory" class="nav-item" class:active={isActive('/directory', false)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      <span>Directory</span>
    </a>

    <a href="/notifications" class="nav-item" class:active={isActive('/notifications')}>
      <div class="icon-wrapper">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {#if unread > 0}
          <span class="notification-dot">{unread}</span>
        {/if}
      </div>
      <span>Notifications</span>
    </a>

    <a href="/you" class="nav-item" class:active={isActive('/you', false)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
        <line x1="9" y1="9" x2="9.01" y2="9"></line>
        <line x1="15" y1="9" x2="15.01" y2="9"></line>
      </svg>
      <span>You</span>
    </a>
  </nav>

  <p class="powered">
    <img src="/SP.avif" alt="" width="16" height="16" />
    SessionPilot Ops
  </p>
</aside>

<style>
  /* Hidden on phones — BottomNav handles navigation there */
  .side-nav {
    display: none;
  }

  @media (min-width: 768px) {
    .side-nav {
      display: flex;
      flex-direction: column;
      width: 230px;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
      height: 100dvh;
      padding: 1.5rem 1rem;
      border-right: 1px solid var(--color-border);
      background: var(--color-surface);
    }
  }

  .brand {
    font-size: 1.4rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    text-transform: lowercase;
    color: var(--color-primary);
    text-decoration: none;
    padding: 0.25rem 0.75rem 1.25rem;
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.65rem 0.75rem;
    border-radius: 10px;
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: 0.92rem;
    font-weight: 500;
    transition: background 0.12s, color 0.12s;
  }

  .nav-item:hover {
    background: #f5f5f5;
    color: var(--color-text);
  }

  .nav-item.active {
    background: var(--color-important-bg);
    color: var(--color-primary);
    font-weight: 600;
  }

  .icon-wrapper {
    position: relative;
    display: flex;
  }

  .notification-dot {
    position: absolute;
    top: -5px;
    right: -7px;
    background-color: #e53e3e;
    color: white;
    font-size: 0.6rem;
    font-weight: bold;
    min-width: 15px;
    height: 15px;
    padding: 0 3px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }

  .powered {
    margin-top: auto;
    font-size: 0.7rem;
    color: #c0c0c0;
    padding: 0 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .powered img {
    border-radius: 4px;
    object-fit: contain;
    opacity: 0.85;
  }
</style>

<script lang="ts">
  import { page } from '$app/stores';

  // Restaurant name assigned by the admin (falls back to the app name)
  let brandName = $derived($page.data.brandName ?? 'proxie');
  let unread = $derived($page.data.unreadNotifications ?? 0);
</script>

<header class="header">
  <div class="logo">
    <h1>{brandName}</h1>
  </div>
  <div class="actions">
    <!-- Refresh Icon -->
    <button class="icon-btn" aria-label="Refresh">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
      </svg>
    </button>
    <!-- Notifications -->
    <a href="/notifications" class="icon-btn" aria-label="Notifications">
      <div class="calendar-wrapper">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {#if unread > 0}
          <span class="badge">{unread}</span>
        {/if}
      </div>
    </a>
    <!-- Team/People Icon -->
    <a href="/directory" class="icon-btn" aria-label="Team">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    </a>
  </div>
</header>

<style>
  .header {
    background-color: var(--color-primary);
    color: white;
    padding: 1.5rem 1rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    box-shadow: 0 4px 12px rgba(240, 113, 34, 0.2);
    position: relative;
    z-index: 10;
  }

  .logo h1 {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    text-transform: lowercase;
  }

  .actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .icon-btn {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    transition: opacity 0.2s;
  }
  
  .icon-btn:hover {
    opacity: 0.8;
  }

  .calendar-wrapper {
    position: relative;
    display: inline-flex;
  }

  .badge {
    position: absolute;
    top: -4px;
    right: -8px;
    font-size: 0.65rem;
    font-weight: 700;
    background: white;
    color: var(--color-primary);
    border-radius: 10px;
    padding: 0 4px;
    min-width: 16px;
    text-align: center;
  }
</style>

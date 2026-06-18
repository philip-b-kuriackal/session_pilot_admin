<script lang="ts">
  let { data } = $props();

  const dateFmt = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' });
  function lastSubmitted(kind: string, fallback: string): string {
    const ts = data.latest?.[kind];
    return ts ? `Last submitted ${dateFmt.format(new Date(ts))}` : fallback;
  }
</script>

<div class="page-container">
  <!-- Header -->
  <header class="header">
    <a href="/you" class="close-button">Close</a>
  </header>

  <main class="content">
    <h1 class="page-title">File a report</h1>

    <!-- Whistleblower Section -->
    <div class="section">
      <h2 class="section-title">Whistleblower</h2>
      
      <a href="/you/report/whistleblower" class="list-item">
        <div class="icon-container whistleblower-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a10 10 0 0 0-7.07 17.07L2 22l2.93-2.93A10 10 0 1 0 12 2z"></path>
            <path d="M12 8v4"></path>
            <path d="M12 16h.01"></path>
          </svg>
        </div>
        <div class="item-text">
          <div class="item-title">Whistleblower</div>
          <div class="item-subtitle">File a Whistleblower report</div>
        </div>
        <div class="chevron">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </a>
    </div>

    <!-- Reports Section -->
    <div class="section mt-4">
      <h2 class="section-title">Reports</h2>
      
      <!-- See submitted reports -->
      <a href="/you/report/history" class="list-item">
        <div class="icon-container default-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
        </div>
        <div class="item-text">
          <div class="item-title">See submitted reports</div>
          <div class="item-subtitle">Submitted reports overview</div>
        </div>
        <div class="chevron">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </a>

      <!-- End of day report -->
      <a href="/you/report/new?kind=end_of_day" class="list-item">
        <div class="icon-container document-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <div class="item-text">
          <div class="item-title">End of day report</div>
          <div class="item-subtitle">{lastSubmitted('end_of_day', 'Wrap up the day')}</div>
        </div>
        <div class="chevron">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </a>

      <!-- Temperature -->
      <a href="/you/report/new?kind=temperature" class="list-item">
        <div class="icon-container document-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <div class="item-text">
          <div class="item-title">Temperature</div>
          <div class="item-subtitle">{lastSubmitted('temperature', 'Log a temperature reading')}</div>
        </div>
        <div class="chevron">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </a>

      <!-- Broken Items -->
      <a href="/you/report/new?kind=broken_item" class="list-item">
        <div class="icon-container document-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <div class="item-text">
          <div class="item-title">Broken Items ⚙️</div>
          <div class="item-subtitle">{lastSubmitted('broken_item', 'Report broken equipment')}</div>
        </div>
        <div class="chevron">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </a>
    </div>
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
  }

  .page-title {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 32px 0;
    font-family: 'Outfit', var(--font-family-base);
  }

  .section {
    margin-bottom: 32px;
  }
  
  .mt-4 {
    margin-top: 1rem;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 16px 0;
  }

  .list-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    text-decoration: none;
    color: inherit;
    margin-bottom: 8px;
  }

  .icon-container {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    flex-shrink: 0;
  }

  .whistleblower-icon {
    background-color: #f3e8ff; /* Light purple */
    color: #9333ea; /* Purple */
  }

  .default-icon {
    background-color: #f3f4f6; /* Light gray */
    color: #6b7280; /* Gray */
  }

  .document-icon {
    background-color: #fce7f3; /* Light pink */
    color: #db2777; /* Pink */
  }

  .item-text {
    flex: 1;
  }

  .item-title {
    font-size: 1rem;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .item-subtitle {
    font-size: 0.85rem;
    color: #9ca3af;
  }

  .chevron {
    color: #9ca3af;
    display: flex;
    align-items: center;
  }
</style>

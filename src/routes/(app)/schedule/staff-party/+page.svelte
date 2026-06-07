<script lang="ts">
  const dummyImage = '/dummy%20image%204.jpg';
</script>

<div class="page-container">
  <!-- Hero Section -->
  <div class="hero-section">
    <img src={dummyImage} alt="Event Hero" class="hero-image" />
    <a href="/schedule" class="back-button">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </a>
  </div>

  <!-- Details Card -->
  <main class="details-card">
    <h1 class="event-title">Staff Party 🌟</h1>

    <div class="info-list">
      <!-- Time Info -->
      <div class="info-row">
        <div class="icon-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="info-content">
          <div class="info-primary">Saturday, July 18</div>
          <div class="info-secondary">19:00 - 23:00</div>
        </div>
      </div>

      <!-- Location Info -->
      <div class="info-row">
        <div class="icon-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div class="info-content">
          <div class="info-primary">Soho</div>
        </div>
      </div>
    </div>

    <!-- Attendees -->
    <div class="attendees-row">
      <span class="attendees-text">3 People are going</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </div>

    <!-- Description -->
    <div class="description-section">
      <h2 class="description-title">Description</h2>
      <p class="description-text">
        Please RSVP for the Staff Party, more information will follow ;)
      </p>
    </div>
  </main>

  <!-- Fixed Bottom Action -->
  <div class="bottom-action-bar">
    <button class="join-button">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="check-icon">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Joining
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="dropdown-icon">
        <path d="M7 10l5 5 5-5z"/>
      </svg>
    </button>
  </div>
</div>

<style>
  .page-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface);
    overflow: hidden;
    position: relative;
  }

  .hero-section {
    position: relative;
    height: 35vh;
    min-height: 250px;
    width: 100%;
  }

  .hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .back-button {
    position: absolute;
    top: max(16px, env(safe-area-inset-top));
    left: 16px;
    width: 44px;
    height: 44px;
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111827;
    text-decoration: none;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .details-card {
    flex: 1;
    background-color: white;
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    margin-top: -24px;
    padding: 32px 24px;
    position: relative;
    z-index: 10;
    overflow-y: auto;
    padding-bottom: 120px; /* Space for the bottom action bar */
  }

  .event-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 24px 0;
  }

  .info-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 24px;
  }

  .info-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .icon-container {
    color: #6b7280;
    margin-top: 2px;
  }

  .info-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-primary {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
  }

  .info-secondary {
    font-size: 0.85rem;
    color: #6b7280;
  }

  .attendees-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-top: 1px solid #f3f4f6;
    border-bottom: 1px solid #f3f4f6;
    margin-bottom: 24px;
    cursor: pointer;
  }

  .attendees-text {
    font-size: 1rem;
    font-weight: 500;
    color: #374151;
  }

  .chevron {
    color: #9ca3af;
  }

  .description-title {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 8px 0;
  }

  .description-text {
    font-size: 0.95rem;
    color: #4b5563;
    line-height: 1.5;
    margin: 0;
  }

  .bottom-action-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 16px 24px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
    background: linear-gradient(to top, rgba(255,255,255,1) 80%, rgba(255,255,255,0));
    z-index: 20;
  }

  .join-button {
    width: 100%;
    background-color: #4ade80; /* Vibrant green */
    color: white;
    border: none;
    border-radius: 12px;
    padding: 16px;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
  }

  .check-icon {
    margin-right: 4px;
  }

  .dropdown-icon {
    margin-left: 4px;
    margin-top: 2px;
  }
</style>

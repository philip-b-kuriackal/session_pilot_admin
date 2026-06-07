<script lang="ts">
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { page } from '$app/stores';

  const dummyImage = '/dmmy%20image.jpg';
  const dummyVideo = '/dummy%20video.mp4';

  let profile = $derived($page.data.profile);
</script>

<div class="page-container">
  <main class="scrollable-content hide-scrollbar">
    
    <!-- Top Hero Section -->
    <div class="hero-section">
      <video autoplay loop muted playsinline class="hero-video">
        <source src={dummyVideo} type="video/mp4" />
      </video>
      <div class="hero-overlay"></div>
      
      <div class="hero-content">
        <!-- Avatar -->
        <div class="avatar-container">
          <img src={profile?.avatar_url ?? dummyImage} alt="Avatar" class="avatar-img" />
          <div class="avatar-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </div>
        </div>
        
        <!-- Welcome Text -->
        <h1 class="welcome-text">Hey {profile?.first_name || 'there'}</h1>
        {#if profile?.location?.name}
          <p class="location-line">{profile.location.name}{profile?.position ? ` · ${profile.position}` : ''}</p>
        {/if}
        
        <!-- Smiley Sticker -->
        <div class="smiley-sticker">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-3 8c.83 0 1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5S8.17 10 9 10zm3 8c-2.76 0-5-2.24-5-5h10c0 2.76-2.24 5-5 5zm3-5c0 .83-.67 1.5-1.5 1.5S12 13.83 12 13s.67-1.5 1.5-1.5 1.5.67 1.5 1.5z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="content-section">
      <!-- Bio Card -->
      <div class="bio-card">
        <div class="bio-header">
          <span class="bio-title">Your bio</span>
          <button class="edit-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
        <p class="bio-text">{profile?.bio ?? 'Tap edit to add your bio ✍️'}</p>
      </div>

      <!-- Earned Badges -->
      <div class="section-container">
        <h2 class="section-title">Earned badges</h2>
        <p class="section-subtitle">Badges you've earned so far</p>
        
        <div class="badges-promo-card">
          <p class="badges-promo-text">Explore academy courses to earn badges!</p>
          <div class="badges-promo-illustration">
            <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
              <rect x="60" y="10" width="30" height="40" rx="4" stroke="#d1d5db" stroke-width="2" fill="white" />
              <rect x="65" y="15" width="20" height="10" rx="2" fill="#f3f4f6" />
              <rect x="65" y="30" width="8" height="8" rx="2" fill="#f3f4f6" />
              <rect x="77" y="30" width="8" height="8" rx="2" fill="#f3f4f6" />
              
              <circle cx="30" cy="45" r="8" fill="#1f2937" />
              <path d="M20 70 Q 20 50, 30 55 T 40 70" fill="#4ade80" />
              <path d="M25 55 L 45 45" stroke="#1f2937" stroke-width="3" stroke-linecap="round" />
              
              <circle cx="50" cy="50" r="8" fill="#fca5a5" />
              <path d="M40 75 Q 40 55, 50 60 T 60 75" fill="#818cf8" />
              <path d="M45 60 L 60 40" stroke="#1f2937" stroke-width="3" stroke-linecap="round" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Menu Items -->
      <div class="menu-list">
        <div class="menu-item">
          <div class="menu-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="menu-content">
            <div class="menu-title">Your profile</div>
            <div class="menu-subtitle">Edit personal info</div>
          </div>
          <div class="menu-chevron">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>

        <hr class="menu-divider" />

        <a href="/you/report" class="menu-item" style="text-decoration: none;">
          <div class="menu-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
          </div>
          <div class="menu-content">
            <div class="menu-title">File a report</div>
            <div class="menu-subtitle">Report misconduct</div>
          </div>
          <div class="menu-chevron">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </a>

        <hr class="menu-divider" />

        <form method="POST" action="/login?/logout" class="signout-form">
          <button type="submit" class="menu-item signout-btn">
            <div class="menu-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
            <div class="menu-content">
              <div class="menu-title">Sign out</div>
              <div class="menu-subtitle">Log out of your account</div>
            </div>
          </button>
        </form>
      </div>

      <!-- Bottom Spacer for Navigation -->
      <div class="bottom-spacer"></div>
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
    overflow: hidden;
    background-color: var(--color-background);
  }

  .location-line {
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.9rem;
    font-weight: 500;
    margin-top: 2px;
  }

  .signout-form {
    margin: 0;
  }

  .signout-btn {
    background: none;
    border: none;
    font-family: inherit;
    font-size: inherit;
    width: 100%;
    text-align: left;
    padding: 0;
    cursor: pointer;
    color: inherit;
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Hero Section */
  .hero-section {
    position: relative;
    height: 380px;
    width: 100%;
    overflow: hidden;
  }

  .hero-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
  }

  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%);
  }

  .hero-content {
    position: absolute;
    bottom: 60px; /* Leave space for the overlapping card */
    left: 0;
    width: 100%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .avatar-container {
    position: relative;
    width: 64px;
    height: 64px;
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 16px;
    object-fit: cover;
  }

  .avatar-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background-color: #ec4899; /* Pink */
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #1f2937;
  }

  .welcome-text {
    color: white;
    font-size: 2.2rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin: 0;
    font-family: 'Outfit', var(--font-family-base);
  }

  .smiley-sticker {
    position: absolute;
    right: 30px;
    top: 20px;
    color: #4ade80; /* Light green */
    width: 48px;
    height: 48px;
    transform: rotate(15deg);
  }

  .smiley-sticker svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.3));
  }

  /* Content Section */
  .content-section {
    position: relative;
    background-color: white;
    min-height: calc(100vh - 350px);
    margin-top: -30px;
    padding: 0;
  }

  /* Bio Card */
  .bio-card {
    background-color: #111827; /* Dark grayish blue */
    border-radius: 12px;
    padding: 16px 20px;
    margin: 0 16px;
    transform: translateY(-50%);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  }

  .bio-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .bio-title {
    color: #9ca3af; /* Light gray */
    font-size: 0.85rem;
    font-weight: 500;
  }

  .edit-btn {
    background: none;
    border: none;
    color: #ec4899; /* Pink */
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bio-text {
    color: white;
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
  }

  /* Earned Badges */
  .section-container {
    padding: 0 20px 24px;
    margin-top: -20px; /* Adjusting for the translated bio card */
  }

  .section-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .section-subtitle {
    font-size: 0.9rem;
    color: #6b7280;
    margin-bottom: 16px;
  }

  .badges-promo-card {
    background-color: #f9fafb; /* Very light gray */
    border-radius: 16px;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .badges-promo-text {
    font-size: 0.95rem;
    color: #374151;
    font-weight: 500;
    max-width: 60%;
    line-height: 1.4;
  }

  .badges-promo-illustration {
    width: 100px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Menu Items */
  .menu-list {
    padding: 0 20px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    padding: 16px 0;
    cursor: pointer;
  }

  .menu-icon {
    width: 24px;
    height: 24px;
    color: #374151;
    margin-right: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-content {
    flex: 1;
  }

  .menu-title {
    font-size: 1rem;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 2px;
  }

  .menu-subtitle {
    font-size: 0.85rem;
    color: #9ca3af;
  }

  .menu-chevron {
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-divider {
    border: none;
    border-top: 1px solid #f3f4f6;
    margin: 0 0 0 40px;
  }

  .bottom-spacer {
    height: 100px;
  }
</style>

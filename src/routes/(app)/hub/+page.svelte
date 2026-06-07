<script lang="ts">
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { page } from '$app/stores';

  // Restaurant name assigned by the admin
  let brandName = $derived($page.data.brandName ?? 'our restaurant');

  const heroImage = '/dummy image 4.jpg'; // Using dummy image 4 as hero placeholder
  const logoImage = '/proxie_studio_logo.svg';

  // Dummy images for cards
  const cardImage1 = '/dummy image 2.jpg';
  const cardImage2 = '/dummy image 3.jpeg';

  let activeTab = $state('Handbooks');
  const tabs = ['Handbooks', 'Academy', 'Tools'];

  let cards = $derived([
    { title: `The Story of ${brandName} 📖`, bgColor: '#d05b15', image: null, link: '/hub/story' },
    { title: "What You'll Need 👩‍🍳", bgColor: null, image: cardImage1, link: '#' },
    { title: 'What We Serve 🍗', bgColor: null, image: cardImage2, link: '#' },
    { title: 'House Rules 🏡', bgColor: '#eab308', image: null, link: '#' }
  ]);
</script>

<div class="page-container">
  <div class="scrollable-content hide-scrollbar">
    <!-- Hero Section -->
    <div class="hero-section" style="background-image: url('{heroImage}');">
      <div class="hero-actions">
        <button class="search-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e66420" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
    </div>

  <div class="content-section">
    <!-- Logo Overlap -->
    <div class="logo-wrapper">
      <img src={logoImage} alt="{brandName} Logo" />
    </div>

    <!-- Header & AI Search -->
    <div class="hub-header">
      <h1>Hub</h1>
      <button class="ai-search-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2"></rect>
          <circle cx="12" cy="5" r="2"></circle>
          <path d="M12 7v4"></path>
          <line x1="8" y1="16" x2="8" y2="16"></line>
          <line x1="16" y1="16" x2="16" y2="16"></line>
        </svg>
        <span>Ask me anything...</span>
      </button>
    </div>

    <!-- Welcome Card -->
    <a href="/hub/welcome" class="welcome-card" style="text-decoration: none; display: flex;">
      <div class="welcome-content">
        <h2>Welcome To {brandName}! <span>→</span></h2>
        <div class="reminder">
          <span class="warning-icon">⚠️</span>
          <span>Quick reminder, this one's overdue</span>
        </div>
        <p>Take a moment to complete it now! 🙌</p>
      </div>
      <div class="progress-circle">
        <svg viewBox="0 0 36 36">
          <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path class="circle" stroke-dasharray="50, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>
        <span class="progress-text">50</span>
      </div>
    </a>

    <!-- Tabs -->
    <div class="tabs">
      {#each tabs as tab}
        <button 
          class="tab {activeTab === tab ? 'active' : ''}" 
          onclick={() => activeTab = tab}
        >
          {tab}
        </button>
      {/each}
    </div>

    <!-- Cards Grid -->
    <div class="cards-grid">
      {#each cards as card}
        <a 
          href={card.link}
          class="hub-card" 
          style={card.image ? `background-image: url('${card.image}');` : `background-color: ${card.bgColor};`}
        >
          <div class="card-title-pill">
            {card.title}
          </div>
        </a>
      {/each}
    </div>
    
    <div class="bottom-spacer"></div>
  </div>
  </div>

  <BottomNav />
</div>

<style>
  .page-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--color-background, #fff);
    position: relative;
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .hero-section {
    height: 260px;
    background-size: cover;
    background-position: center;
    position: relative;
    flex-shrink: 0;
  }

  .hero-actions {
    position: absolute;
    top: calc(1rem + env(safe-area-inset-top));
    right: 1.25rem;
  }

  .search-btn {
    width: 44px;
    height: 44px;
    background-color: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .content-section {
    position: relative;
    padding: 0 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .logo-wrapper {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    background-color: #e66420;
    margin-top: -40px;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(230, 100, 32, 0.3);
    z-index: 10;
    overflow: hidden;
  }

  .logo-wrapper img {
    width: 80%;
    height: 80%;
    object-fit: contain;
  }

  .hub-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .hub-header h1 {
    font-size: 2.2rem;
    font-weight: 800;
    margin: 0;
    color: var(--color-text, #111);
    letter-spacing: -0.03em;
  }

  .ai-search-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--color-surface, #f3f4f6);
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 20px;
    color: var(--color-text-muted, #666);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
  }
  
  :global(body.dark) .ai-search-btn {
    background-color: #2a2a2a;
  }

  .welcome-card {
    background: linear-gradient(135deg, #f97316, #ea580c);
    border-radius: 20px;
    padding: 1.5rem;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 20px rgba(234, 88, 12, 0.2);
  }

  .welcome-content {
    flex: 1;
    min-width: 0;
    padding-right: 1rem;
  }

  .welcome-content h2 {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .reminder {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 0.25rem;
  }

  .welcome-content p {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .progress-circle {
    position: relative;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
  }

  .progress-circle svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .circle-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.3);
    stroke-width: 2.5;
  }

  .circle {
    fill: none;
    stroke: white;
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.85rem;
    font-weight: 700;
  }

  .tabs {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .tab {
    background: none;
    border: none;
    font-size: 1rem;
    color: var(--color-text-muted, #888);
    font-weight: 500;
    padding: 0 0 0.75rem 0;
    cursor: pointer;
    position: relative;
  }

  .tab.active {
    color: var(--color-text, #111);
    font-weight: 600;
  }

  .tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--color-text, #111);
  }

  .cards-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1rem;
    width: 100%;
  }

  .hub-card {
    height: 160px;
    border-radius: 20px;
    background-size: cover;
    background-position: center;
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
    padding: 0.75rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    min-width: 0;
    text-decoration: none;
  }

  .card-title-pill {
    background-color: white;
    color: #111;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    max-width: 100%;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bottom-spacer {
    height: 100px;
  }
</style>

<script lang="ts">
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { page } from '$app/stores';

  let brandName = $derived($page.data.brandName ?? 'our restaurant');

  const cardImage1 = '/dummy image 2.jpg';
  const cardImage2 = '/dummy image 3.jpeg';
  const cardImage3 = '/dummy image 4.jpg';

  let cards = $derived([
    { title: `The Origins of ${brandName}`, image: cardImage1, link: '/hub/story/origins' },
    { title: `The Growth and Expansion of ${brandName}`, image: cardImage2, link: '#' },
    { title: `${brandName} Today and Looking Forward`, image: cardImage3, link: '#' }
  ]);
</script>

<div class="page-container">
  <div class="scrollable-content hide-scrollbar">
    <!-- Hero Section -->
    <div class="hero-section bg-orange">
      <a href="/hub" class="back-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </a>
      
      <!-- Logo illustration placeholder -->
      <div class="logo-illustration">
        <div class="est-text">EST.</div>
        <svg width="100" height="120" viewBox="0 0 100 120" fill="white">
          <path d="M50,10 C70,10 80,30 80,50 C80,70 70,90 50,110 C30,90 20,70 20,50 C20,30 30,10 50,10 Z" />
          <circle cx="50" cy="35" r="5" fill="#f26f21" />
        </svg>
        <div class="est-text">1972</div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="content-section">
      <div class="header-titles">
        <h1>The Story of</h1>
        <h1>{brandName} 📖</h1>
      </div>

      <!-- Cards Grid -->
      <div class="cards-grid">
        {#each cards as card}
          <a href={card.link} class="hub-card" style="background-image: url('{card.image}');">
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
    height: 240px;
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .bg-orange {
    background-color: #f26f21;
  }

  .back-btn {
    position: absolute;
    top: calc(1.5rem + env(safe-area-inset-top));
    left: 1.25rem;
    width: 44px;
    height: 44px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 10;
  }
  
  .logo-illustration {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: white;
    font-weight: 800;
    font-size: 1.2rem;
    margin-top: 1rem;
  }

  .content-section {
    position: relative;
    padding: 2rem 1.25rem 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--color-background, #fff);
    border-top-left-radius: 32px;
    border-top-right-radius: 32px;
    margin-top: -32px;
    z-index: 5;
  }

  .header-titles {
    margin-bottom: 2rem;
  }

  .header-titles h1 {
    font-size: 2.2rem;
    font-weight: 800;
    margin: 0;
    color: var(--color-text, #111);
    line-height: 1.1;
    letter-spacing: -0.03em;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1rem;
    width: 100%;
  }

  .hub-card {
    height: 180px;
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
    padding: 0.6rem 0.85rem;
    border-radius: 14px;
    font-size: 0.85rem;
    font-weight: 600;
    width: 100%; /* In the screenshot, it wraps but stretches slightly. Using 100% since it breaks to multiple lines in screenshot? Wait, first screenshot text wraps into two lines! */
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    white-space: normal;
    line-height: 1.3;
  }

  .bottom-spacer {
    height: 100px;
  }
</style>

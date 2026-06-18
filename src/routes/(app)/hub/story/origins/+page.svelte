<script lang="ts">
  import BottomNav from '$lib/app/components/BottomNav.svelte';

  const heroImage = '/dummy image 2.jpg';
  const bottomImage = '/dummy image 3.jpeg';
  const chickenIcon = '/proxie_studio_logo.svg';
</script>

<div class="page-container">
  <div class="scrollable-content hide-scrollbar">
    <!-- Hero Section -->
    <div class="hero-section" style="background-image: url('{heroImage}');">
      <div class="hero-overlay"></div>
      <div class="header-actions">
        <a href="/hub/story" class="action-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </a>
        <button class="action-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </button>
      </div>
    </div>

    <!-- Content Section -->
    <div class="content-section">
      <div class="article-header">
        <span class="category">The Story of Proxie 📖</span>
        <h1>The Origins of Proxie</h1>
        
        <div class="brand-divider">
          <h2 class="brand-text">PROXIE</h2>
          <div class="orange-line"></div>
        </div>
      </div>

      <div class="article-body">
        <p>
          <strong>Lorem Ipsum</strong> is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966, when designers at Letraset and James Mosley, the librarian at St Bride Printing Library, took a 1914 Cicero translation and scrambled it to make dummy text for Letraset's Body Type sheets. It has survived not only many decades, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised thanks to these sheets and more recently with desktop publishing software including versions of Lorem Ipsum.
        </p>
        <p>
          It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).
        </p>
      </div>
      
      <div class="article-footer">
        <div class="footer-divider">
          <div class="chicken-icon-wrapper">
            <!-- Using SVG or image for the small chicken -->
            <img src={chickenIcon} alt="Chicken Logo" />
          </div>
          <div class="orange-line-full"></div>
        </div>
        
        <div class="bottom-banner">
          <img src={bottomImage} alt="Bonafide" />
        </div>
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
    height: 280px;
    position: relative;
    flex-shrink: 0;
    background-size: cover;
    background-position: center;
  }
  
  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%);
  }

  .header-actions {
    position: absolute;
    top: calc(1.5rem + env(safe-area-inset-top));
    left: 1.25rem;
    right: 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 10;
  }

  .action-btn {
    width: 44px;
    height: 44px;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border: none;
    cursor: pointer;
  }

  .content-section {
    position: relative;
    padding: 2rem 1.5rem 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--color-background, #fff);
    border-top-left-radius: 32px;
    border-top-right-radius: 32px;
    margin-top: -40px;
    z-index: 5;
  }

  .category {
    font-size: 0.9rem;
    color: var(--color-text-muted, #666);
    font-weight: 500;
    display: block;
    margin-bottom: 0.5rem;
  }

  .article-header h1 {
    font-size: 2rem;
    font-weight: 800;
    margin: 0 0 1rem 0;
    color: var(--color-text, #111);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  .brand-divider {
    margin-bottom: 1.5rem;
  }

  .brand-text {
    font-size: 2.2rem;
    font-weight: 900;
    color: #e66420; /* Popeyes orange */
    margin: 0;
    line-height: 1;
    letter-spacing: -0.05em;
    font-family: 'Arial Black', Impact, sans-serif;
    transform: scaleY(0.9);
    transform-origin: bottom left;
  }

  .orange-line {
    height: 3px;
    background-color: #e66420;
    width: 100%;
    margin-top: 4px;
  }

  .article-body p {
    font-size: 1.05rem;
    line-height: 1.6;
    color: var(--color-text, #333);
    margin: 0 0 1.5rem 0;
  }
  
  .article-body strong {
    font-weight: 700;
  }
  
  :global(body.dark) .article-body p {
    color: #ddd;
  }

  .footer-divider {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    margin-top: 2rem;
  }

  .chicken-icon-wrapper {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .chicken-icon-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    /* Basic filter to make it orange if it's black by default, but proxie_studio_logo is already orange */
  }

  .orange-line-full {
    flex: 1;
    height: 2px;
    background-color: #e66420;
  }

  .bottom-banner {
    width: 100%;
    height: 100px;
    border-radius: 12px;
    overflow: hidden;
  }

  .bottom-banner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .bottom-spacer {
    height: 100px;
  }
</style>

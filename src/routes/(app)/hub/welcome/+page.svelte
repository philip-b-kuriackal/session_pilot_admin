<script lang="ts">
  import BottomNav from '$lib/app/components/BottomNav.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import OnboardingBadgeModal from '$lib/app/components/OnboardingBadgeModal.svelte';
  import { aboutUsLessonKeys, QUIZ_KEY } from '../lessons';

  let brandName = $derived($page.data.brandName ?? 'our restaurant');

  // Real learning progress (loaded by hub/+layout.server.ts)
  let completions = $derived<string[]>($page.data.completions ?? []);
  let aboutUsDone = $derived(aboutUsLessonKeys(brandName).every((k) => completions.includes(k)));
  let quizDone = $derived(completions.includes(QUIZ_KEY));

  const heroImage = '/dummy image 4.jpg'; // Using dummy image 4 as hero placeholder for employee picture
  
  // Node images
  const img1 = '/dummy image 2.jpg';
  const img2 = '/dummy image 3.jpeg';
  const img3 = '/dummy image 4.jpg';
  const img4 = '/dummy image 5.jpg'; // Assuming we have some other images or reuse
  const badgeIcon = '/proxie_studio_logo.svg';

</script>

{#if $page.url.searchParams.get('badgeUnlocked') === 'true'}
  <OnboardingBadgeModal onClose={() => {
    goto($page.url.pathname, { replaceState: true });
  }} />
{/if}

<div class="page-container">
  <div class="scrollable-content hide-scrollbar">
    <!-- Hero Section -->
    <div class="hero-section" style="background-image: url('{heroImage}');">
      <div class="hero-overlay"></div>
      <a href="/hub" class="back-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </a>
    </div>

    <!-- Content Section -->
    <div class="content-section">
      <div class="header-titles">
        <span class="category">Course</span>
        <h1>Welcome To {brandName}!</h1>
        <p>Please get to know us a bit better...</p>
      </div>

      <!-- Timeline Area -->
      <div class="timeline-area">
        
        <!-- SVG Path for the connection lines -->
        <!-- ViewBox assumes a rough 320x600 coordinate system for easy drawing -->
        <svg class="timeline-svg" viewBox="0 0 320 650" preserveAspectRatio="xMidYMin slice">
          <!-- Node centers (approx): 
               1: (90, 80) 
               2: (230, 230)
               3: (160, 380)
               4: (90, 530)
               5: (160, 680)
          -->
          <!-- Solid Line (Node 1 to Node 2) -->
          <path d="M 90 80 C 140 80, 180 100, 230 230" fill="none" stroke="#e66420" stroke-width="3" />
          <!-- Solid Line (Node 2 to Node 3) -->
          <path d="M 230 230 C 250 310, 190 350, 160 380" fill="none" stroke="#e66420" stroke-width="3" />
          <!-- Solid Line (Node 3 to solid horizontal line segment in screenshot) -->
          <!-- Actually, the screenshot shows node 3 to node 4 is dashed, but node 3 has a solid orange line entering it -->
          
          <!-- Dashed Line (Node 3 to Node 4) -->
          <path d="M 160 380 C 120 400, 90 440, 90 530" fill="none" stroke="#ccc" stroke-width="3" stroke-dasharray="8,8" stroke-linecap="round" />
          
          <!-- Dashed Line (Node 4 to Node 5) -->
          <path d="M 90 530 C 90 600, 160 600, 160 650" fill="none" stroke="#ccc" stroke-width="3" stroke-dasharray="8,8" stroke-linecap="round" />
        </svg>

        <!-- Node 1 — About us (completed when every about-us lesson is done) -->
        <a href="/hub/welcome/about-us" class="timeline-node" style="top: 40px; left: 50px; text-decoration: none;">
          <div class="node-circle {aboutUsDone ? 'active' : 'pending'}">
            <img src={img1} alt="About us" />
            {#if aboutUsDone}
              <div class="node-badge success">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            {/if}
          </div>
          <div class="node-label">A bit about<br/>us...</div>
        </a>

        <!-- Node 2 — Our Menu (content not available yet) -->
        <div class="timeline-node coming-soon" style="top: 190px; left: 190px;">
          <div class="node-circle pending">
            <img src={img2} alt="Our Menu" style="opacity: 0.5; filter: grayscale(100%);" />
          </div>
          <div class="node-label">Our Menu!</div>
          <div class="soon-pill">coming soon</div>
        </div>

        <!-- Node 3 — Workshop (content not available yet) -->
        <div class="timeline-node coming-soon" style="top: 340px; left: 120px;">
          <div class="node-circle pending">
            <img src={img3} alt="Workshop" style="opacity: 0.5; filter: grayscale(100%);" />
          </div>
          <div class="node-label">In person<br/>workshop</div>
          <div class="soon-pill">coming soon</div>
        </div>

        <!-- Node 4 — Quiz (completed when 'welcome.quiz' is recorded) -->
        <a href="/hub/welcome/quiz" class="timeline-node" style="top: 490px; left: 50px; text-decoration: none;">
          <div class="node-circle {quizDone ? 'active' : 'pending'}">
            <img src={img1} alt="Before shift" style={quizDone ? '' : 'opacity: 0.5; filter: grayscale(100%);'} />
            {#if quizDone}
              <div class="node-badge success">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            {/if}
          </div>
          <div class="node-label">Before your<br/>first shift...</div>
        </a>

        <!-- Node 5 (Badge) — earned once the quiz is passed -->
        <div class="timeline-node" style="top: 660px; left: 120px;">
          <div class="completion-badge" class:locked={!quizDone}>
            <img src={badgeIcon} alt="Badge" />
            <div class="badge-text">ONBOARDING<br/>COMPLETE</div>
          </div>
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
    height: 240px;
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

  .back-btn {
    position: absolute;
    top: calc(1.5rem + env(safe-area-inset-top));
    left: 1.25rem;
    width: 44px;
    height: 44px;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 10;
  }

  .content-section {
    position: relative;
    padding: 2rem 0;
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
    padding: 0 1.5rem;
    margin-bottom: 2rem;
  }

  .category {
    font-size: 0.85rem;
    color: var(--color-text-muted, #666);
    font-weight: 600;
    display: block;
    margin-bottom: 0.5rem;
  }

  .header-titles h1 {
    font-size: 1.8rem;
    font-weight: 800;
    margin: 0 0 0.75rem 0;
    color: var(--color-text, #111);
    letter-spacing: -0.02em;
  }

  .header-titles p {
    font-size: 1rem;
    color: var(--color-text, #333);
    margin: 0;
  }

  /* Timeline Area */
  .timeline-area {
    position: relative;
    width: 100%;
    height: 800px; /* enough space for all nodes */
    margin: 0 auto;
    max-width: 380px;
  }

  .timeline-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 650px;
    z-index: 1;
  }

  .timeline-node {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 80px;
    z-index: 2;
  }

  .node-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    padding: 6px;
    background-color: white;
    position: relative;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }

  .node-circle.active {
    border: 3px solid #e66420;
    padding: 3px; /* Compensate for border */
  }

  .node-circle.pending {
    border: 3px solid #e2e8f0;
    padding: 3px;
  }

  .node-circle img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .node-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }

  .node-badge.success {
    background-color: #e66420;
  }
  
  .node-badge.success svg {
    width: 14px;
    height: 14px;
  }

  .node-label {
    text-align: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text, #111);
    margin-top: 0.75rem;
    line-height: 1.2;
    width: 120px;
  }

  .soon-pill {
    background-color: #e5e7eb;
    color: #6b7280;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.6rem;
    border-radius: 10px;
    margin-top: 0.4rem;
    text-transform: lowercase;
  }

  .timeline-node.coming-soon .node-label {
    color: var(--color-text-muted, #888);
  }

  .completion-badge {
    width: 80px;
    height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  .completion-badge img {
    width: 60px;
    height: 60px;
    object-fit: contain;
    /* We assume this is an SVG badge, if not we could use a pure CSS starburst */
  }

  .completion-badge.locked {
    filter: grayscale(100%);
    opacity: 0.45;
  }

  .badge-text {
    position: absolute;
    font-size: 0.5rem;
    font-weight: 900;
    color: white;
    text-align: center;
    line-height: 1;
    top: 50%;
    transform: translateY(-50%);
  }

  .bottom-spacer {
    height: 120px;
  }
</style>

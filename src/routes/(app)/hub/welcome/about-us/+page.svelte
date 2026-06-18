<script lang="ts">
  import { goto } from '$app/navigation';
  import BottomNav from '$lib/app/components/BottomNav.svelte';
  import VideoOverlay from '$lib/app/components/VideoOverlay.svelte';
  import { page } from '$app/stores';
  import { aboutUsLessonKey, markLessonComplete } from '../../lessons';

  let brandName = $derived($page.data.brandName ?? 'our restaurant');

  const heroImage = '/dummy image 4.jpg';

  const img1 = '/dummy image 2.jpg';
  const img2 = '/dummy image 3.jpeg';
  const img3 = '/dummy image 4.jpg';
  const imgVideo = '/dummy image 5.jpg';

  let isVideoOpen = $state(false);

  let lessons = $derived(
    [
      { title: `The Origins of ${brandName}`, type: 'Article', time: '1 min', icon: '📄', image: img1, link: '/hub/story/origins', isVideo: false },
      { title: `The Growth and Expansion of ${brandName}`, type: 'Article', time: '1 min', icon: '📄', image: img2, link: '/hub/story/origins', isVideo: false },
      { title: `${brandName} Today and Looking Forward`, type: 'Article', time: '1 min', icon: '📄', image: img3, link: '/hub/story/origins', isVideo: false },
      { title: 'Surprise Guest 🔥', type: 'Video', time: '3 min', icon: '▶️', image: imgVideo, link: '', isVideo: true }
    ].map((l) => ({ ...l, key: aboutUsLessonKey(l.title) }))
  );

  // Completed state = persisted completions + optimistic marks from this visit
  let optimistic = $state<string[]>([]);
  let completedKeys = $derived(
    new Set<string>([...(($page.data.completions as string[] | undefined) ?? []), ...optimistic])
  );

  function complete(key: string) {
    if (completedKeys.has(key)) return;
    optimistic = [...optimistic, key];
    void markLessonComplete(key);
  }
</script>

{#if isVideoOpen}
  <VideoOverlay
    videoSrc="/dummy video.mp4"
    title="Surprise Guest 🔥"
    onClose={() => {
      complete(aboutUsLessonKey('Surprise Guest 🔥'));
      isVideoOpen = false;
    }}
  />
{/if}

<div class="page-container" style={isVideoOpen ? 'display: none;' : ''}>
  <div class="scrollable-content hide-scrollbar">
    
    <!-- Hero Section -->
    <div class="hero-section" style="background-image: url('{heroImage}');">
      <div class="hero-overlay"></div>
      <button class="back-btn" onclick={() => goto('/hub/welcome')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>
    </div>

    <!-- Content Section -->
    <div class="content-section">
      <div class="header-titles">
        <span class="category">Welcome To {brandName}!</span>
        <h1>A Bit About Us....</h1>
        <p>Our beginnings</p>
      </div>

      <!-- Timeline List -->
      <div class="timeline-list">
        <!-- The dashed connecting line -->
        <div class="timeline-line"></div>

        {#each lessons as lesson}
          {@const isDone = completedKeys.has(lesson.key)}
          <div class="timeline-item">
            <!-- Node checkmark -->
            <div class="node-wrapper">
              <div class="check-circle {isDone ? 'completed' : 'pending'}">
                {#if isDone}
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {/if}
              </div>
            </div>

            <!-- Card -->
            {#if lesson.isVideo}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <div class="lesson-card" onclick={() => isVideoOpen = true}>
                <div class="card-info">
                  <h3 class="lesson-title">{lesson.title}</h3>
                  <div class="lesson-meta">
                    <span class="meta-icon">{lesson.icon}</span>
                    <span>{lesson.type}</span>
                    <span class="dot">•</span>
                    <span class="meta-time">⏱️ {lesson.time}</span>
                  </div>
                </div>
                <div class="card-image">
                  <img src={lesson.image} alt={lesson.title} />
                  <div class="video-play-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </div>
                </div>
              </div>
            {:else}
              <a href={lesson.link} class="lesson-card" onclick={() => complete(lesson.key)}>
                <div class="card-info">
                  <h3 class="lesson-title">{lesson.title}</h3>
                  <div class="lesson-meta">
                    <span class="meta-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </span>
                    <span>{lesson.type}</span>
                    <span class="dot">•</span>
                    <span class="meta-time">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      {lesson.time}
                    </span>
                  </div>
                </div>
                <div class="card-image">
                  <img src={lesson.image} alt={lesson.title} />
                </div>
              </a>
            {/if}
          </div>
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
    background-color: var(--color-background, #fff);
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
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
    border: none;
    cursor: pointer;
    z-index: 10;
  }

  .content-section {
    position: relative;
    padding: 2rem 1.25rem;
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
    margin-bottom: 2.5rem;
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
    margin: 0 0 0.5rem 0;
    color: var(--color-text, #111);
    letter-spacing: -0.02em;
  }

  .header-titles p {
    font-size: 1rem;
    color: var(--color-text, #333);
    margin: 0;
    font-weight: 500;
  }

  /* Timeline Layout */
  .timeline-list {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-left: 10px; /* Space for the line */
  }

  .timeline-line {
    position: absolute;
    top: 24px; /* Start slightly below first node */
    bottom: 24px; /* End slightly above last node */
    left: 21px; /* Align with center of node circles (10px padding + 12px circle radius) */
    width: 2px;
    border-left: 2px dashed #e66420;
    z-index: 1;
  }

  .timeline-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;
    z-index: 2;
  }

  .node-wrapper {
    background: white;
    padding: 4px 0;
  }

  .check-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .check-circle.completed {
    background-color: #e66420;
  }

  .check-circle.pending {
    background-color: #fff;
    border: 2px solid #e2e8f0;
  }
  
  .check-circle.completed svg {
    width: 14px;
    height: 14px;
  }

  /* Card Layout */
  .lesson-card {
    flex: 1;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    padding: 1rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    text-decoration: none;
    color: inherit;
    cursor: pointer;
  }

  .card-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
    padding-right: 1rem;
  }

  .lesson-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text, #111);
    margin: 0 0 0.5rem 0;
    line-height: 1.3;
  }

  .lesson-meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    color: var(--color-text-muted, #777);
  }

  .meta-icon {
    display: flex;
    align-items: center;
    opacity: 0.7;
  }

  .dot {
    opacity: 0.5;
  }

  .meta-time {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .card-image {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
  }

  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .video-play-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 28px;
    height: 28px;
    background-color: rgba(242, 111, 33, 0.9); /* Popeyes orange */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .video-play-icon svg {
    margin-left: 2px; /* Visual center adjustment for play triangle */
  }

  .bottom-spacer {
    height: 100px;
  }
</style>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  let { videoSrc, title = "Video", onClose }: { videoSrc: string, title?: string, onClose: () => void } = $props();

  let videoElement: HTMLVideoElement | undefined = $state();
  let isPlaying = $state(false);
  let isMuted = $state(false);
  let progress = $state(0);
  let duration = $state(0);
  let currentTime = $state(0);
  
  // Controls visibility toggle
  let showControls = $state(true);
  let hideControlsTimeout: ReturnType<typeof setTimeout>;

  function togglePlay() {
    if (!videoElement) return;
    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
    isPlaying = !isPlaying;
    resetControlsTimeout();
  }

  function skip(seconds: number) {
    if (videoElement) {
      videoElement.currentTime += seconds;
    }
    resetControlsTimeout();
  }

  function toggleMute() {
    if (videoElement) {
      videoElement.muted = !videoElement.muted;
      isMuted = videoElement.muted;
    }
    resetControlsTimeout();
  }

  function handleTimeUpdate() {
    if (!videoElement) return;
    currentTime = videoElement.currentTime;
    if (duration > 0) {
      progress = (currentTime / duration) * 100;
    }
  }

  function handleLoadedMetadata() {
    if (videoElement) {
      duration = videoElement.duration;
    }
  }
  
  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function toggleControls() {
    showControls = !showControls;
    if (showControls && isPlaying) {
      resetControlsTimeout();
    }
  }

  function resetControlsTimeout() {
    clearTimeout(hideControlsTimeout);
    showControls = true;
    if (isPlaying) {
      hideControlsTimeout = setTimeout(() => {
        showControls = false;
      }, 3000);
    }
  }

  onMount(() => {
    resetControlsTimeout();
  });

  onDestroy(() => {
    clearTimeout(hideControlsTimeout);
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="video-overlay" class:playing={isPlaying} onclick={(e) => { if (e.target === e.currentTarget) toggleControls(); }}>
  
  <!-- The Video Element -->
  <video 
    bind:this={videoElement}
    src={videoSrc}
    class="video-player"
    playsinline
    ontimeupdate={handleTimeUpdate}
    onloadedmetadata={handleLoadedMetadata}
    onended={() => { isPlaying = false; showControls = true; }}
    onclick={toggleControls}
  >
    <track kind="captions" />
  </video>

  <!-- Controls Container -->
  <div class="controls-container" class:visible={showControls}>
    
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="title-area">
        <span class="video-title">{title}</span>
        <span class="video-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>
      <button class="icon-btn close-btn" onclick={(e) => { e.stopPropagation(); onClose(); }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- Center/Bottom Controls -->
    <div class="bottom-controls">
      
      <!-- Progress Bar -->
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {progress}%"></div>
          <div class="progress-thumb" style="left: {progress}%"></div>
        </div>
      </div>

      <!-- Playback Buttons -->
      <div class="playback-buttons">
        <button class="icon-btn" onclick={(e) => { e.stopPropagation(); skip(-15); }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5"></path>
            <text x="12" y="16" font-size="8" fill="white" stroke="none" text-anchor="middle">15</text>
          </svg>
        </button>

        <button class="play-pause-btn" onclick={(e) => { e.stopPropagation(); togglePlay(); }}>
          {#if isPlaying}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="none">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          {:else}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          {/if}
        </button>

        <button class="icon-btn" onclick={(e) => { e.stopPropagation(); skip(15); }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11V9a4 4 0 0 0-4-4H3"></path>
            <polyline points="17 23 21 19 17 15"></polyline>
            <path d="M3 12v7a2 2 0 0 0 2 2h14"></path>
            <text x="12" y="16" font-size="8" fill="white" stroke="none" text-anchor="middle">15</text>
          </svg>
        </button>

        <button class="icon-btn volume-btn" onclick={(e) => { e.stopPropagation(); toggleMute(); }}>
          {#if isMuted}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          {:else}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          {/if}
        </button>
      </div>

    </div>
  </div>
</div>

<style>
  .video-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: #111;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  }

  .video-player {
    width: 100%;
    max-height: 100vh;
    object-fit: contain;
  }

  .controls-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: none; /* Let clicks pass through to video unless hitting a button */
    opacity: 0;
    transition: opacity 0.3s ease;
    background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.8) 100%);
  }

  .controls-container.visible {
    opacity: 1;
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: calc(1rem + env(safe-area-inset-top)) 1.5rem;
    pointer-events: auto;
  }

  .title-area {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: white;
  }

  .video-title {
    font-size: 1rem;
    font-weight: 700;
  }

  .video-time {
    font-size: 0.85rem;
    color: #ccc;
    font-variant-numeric: tabular-nums;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    opacity: 0.9;
    transition: opacity 0.2s;
  }

  .icon-btn:hover {
    opacity: 1;
  }

  .close-btn {
    margin-right: -8px;
  }

  .bottom-controls {
    padding: 0 2rem 2.5rem;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .progress-container {
    width: 100%;
    height: 20px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background-color: rgba(255,255,255,0.3);
    border-radius: 2px;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    background-color: white;
    border-radius: 2px;
    position: absolute;
    top: 0;
    left: 0;
  }

  .progress-thumb {
    width: 12px;
    height: 12px;
    background-color: white;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 4px rgba(0,0,0,0.5);
  }

  .playback-buttons {
    display: flex;
    align-items: center;
    gap: 2rem;
    width: 100%;
    justify-content: center;
    position: relative;
  }

  .play-pause-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: rgba(255,255,255,0.2);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    backdrop-filter: blur(4px);
  }

  .volume-btn {
    position: absolute;
    right: 0;
  }
</style>

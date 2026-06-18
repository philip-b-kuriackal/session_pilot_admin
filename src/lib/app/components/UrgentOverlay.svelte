<script lang="ts">
  import { invalidateAll } from '$app/navigation';

  let { post } = $props<{
    post: {
      id: string;
      content: string;
      image_url: string | null;
      created_at: string;
      authorName: string;
      authorRole: string;
    };
  }>();

  // swipe gesture state
  let dragY = $state(0);
  let dragging = $state(false);
  let leaving = $state(false);
  let startY = 0;

  const DISMISS_AT = 140; // px upward to dismiss

  function onPointerDown(e: PointerEvent) {
    if (leaving) return;
    dragging = true;
    startY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging || leaving) return;
    // only allow upward swipes
    dragY = Math.min(0, e.clientY - startY);
  }

  async function onPointerUp() {
    if (!dragging || leaving) return;
    dragging = false;
    if (-dragY >= DISMISS_AT) {
      leaving = true;
      dragY = -window.innerHeight;
      // record the dismissal, then refresh layout data
      try {
        await fetch('/urgent-dismiss', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id })
        });
      } finally {
        setTimeout(() => invalidateAll(), 250);
      }
    } else {
      dragY = 0; // spring back
    }
  }

  function timeLabel(iso: string): string {
    return new Date(iso).toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  let progress = $derived(Math.min(1, -dragY / DISMISS_AT));
</script>

<div
  class="urgent-overlay"
  class:leaving
  style="transform: translateY({dragY}px); opacity: {1 - progress * 0.35}; transition: {dragging ? 'none' : 'transform 0.25s ease, opacity 0.25s ease'};"
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
  role="alertdialog"
  aria-label="Urgent broadcast"
>
  <div class="siren-band">
    <span class="siren">🚨</span>
    <span class="urgent-label">URGENT</span>
    <span class="siren">🚨</span>
  </div>

  <div class="urgent-body">
    <p class="urgent-content">{post.content}</p>

    {#if post.image_url}
      <img class="urgent-image" src={post.image_url} alt="Attached to urgent broadcast" draggable="false" />
    {/if}

    <div class="urgent-meta">
      <strong>{post.authorName}</strong>{post.authorRole ? ` · ${post.authorRole}` : ''}
      <span class="urgent-time">{timeLabel(post.created_at)}</span>
    </div>
  </div>

  <div class="swipe-hint" style="opacity: {1 - progress};">
    <div class="chevrons">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
    </div>
    Swipe up to dismiss
  </div>

  <div class="dismiss-track">
    <div class="dismiss-fill" style="width: {progress * 100}%"></div>
  </div>
</div>

<style>
  .urgent-overlay {
    position: absolute;
    inset: 0;
    z-index: 500;
    background: linear-gradient(170deg, #7f1d1d 0%, #b91c1c 45%, #dc2626 100%);
    color: white;
    display: flex;
    flex-direction: column;
    padding: max(20px, env(safe-area-inset-top)) 22px max(28px, env(safe-area-inset-bottom));
    touch-action: none;
    user-select: none;
    cursor: grab;
    overflow: hidden;
  }

  .urgent-overlay:active { cursor: grabbing; }

  .siren-band {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 10px 0 6px;
  }

  .siren {
    font-size: 1.6rem;
    animation: flash 1s ease-in-out infinite;
  }

  @keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  .urgent-label {
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: 0.35em;
    text-indent: 0.35em;
  }

  .urgent-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 18px;
    min-height: 0;
  }

  .urgent-content {
    font-size: 1.45rem;
    font-weight: 700;
    line-height: 1.35;
    letter-spacing: -0.3px;
    max-height: 45vh;
    overflow-y: auto;
  }

  .urgent-image {
    max-height: 200px;
    width: 100%;
    object-fit: cover;
    border-radius: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    pointer-events: none;
  }

  .urgent-meta {
    font-size: 0.88rem;
    opacity: 0.92;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .urgent-time {
    font-size: 0.76rem;
    opacity: 0.75;
  }

  .swipe-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    font-size: 0.85rem;
    font-weight: 700;
    padding-top: 12px;
  }

  .chevrons {
    display: flex;
    flex-direction: column;
    gap: 0;
    line-height: 0;
  }

  .chevrons svg:first-child { animation: rise 1.4s ease-in-out infinite; }
  .chevrons svg:last-child { animation: rise 1.4s ease-in-out 0.2s infinite; margin-top: -14px; }

  @keyframes rise {
    0%, 100% { transform: translateY(4px); opacity: 0.4; }
    50% { transform: translateY(-3px); opacity: 1; }
  }

  .dismiss-track {
    margin-top: 12px;
    height: 5px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.25);
    overflow: hidden;
  }

  .dismiss-fill {
    height: 100%;
    border-radius: 999px;
    background: white;
    transition: width 0.05s linear;
  }
</style>

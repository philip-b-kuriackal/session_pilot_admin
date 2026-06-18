<script lang="ts">
  let { onclick } = $props<{ onclick?: () => void }>();
</script>

<button class="fab" aria-label="Add new post" {onclick}>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
</button>

<style>
  .fab {
    position: fixed;
    bottom: 80px; /* Above bottom nav */
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: var(--color-primary);
    color: white;
    border: none;
    box-shadow: 0 4px 12px rgba(240, 113, 34, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 100;
    transition: transform 0.2s, background-color 0.2s;
  }
  
  /* Make it absolute if inside relative app-container to stick within max-width layout */
  :global(.app-container) .fab {
    position: absolute;
  }

  .fab:active {
    transform: scale(0.95);
  }
  
  .fab:hover {
    background-color: var(--color-primary-dark);
  }
</style>

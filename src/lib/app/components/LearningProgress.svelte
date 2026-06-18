<script lang="ts">
  let { progress = null } = $props<{ progress?: any }>();
</script>

{#if progress}
  <div class="learning-section">
    <h3 class="section-title">Your learning progress</h3>
    <div class="learning-card">
      <div class="learning-image-wrapper">
        <img src={progress.image} alt={progress.title} class="learning-image" />
      </div>
      <div class="learning-info">
        <p class="status">{progress.status}</p>
        <p class="title">{progress.title}</p>
      </div>
    </div>
  </div>
{/if}

<style>
  .learning-section {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 0.75rem;
  }

  .learning-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #fdf6ec; /* Slight orange tint background from screenshot */
    padding: 0.75rem;
    border-radius: 12px;
    border: 1px solid #fce8d5;
  }

  .learning-image-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .learning-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .learning-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .status {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-text);
  }
</style>

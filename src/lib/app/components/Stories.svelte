<script lang="ts">
  let { stories = [] } = $props<{ stories?: any[] }>();
</script>

<div class="stories-container hide-scrollbar">
  {#each stories as story}
    <button class="story-item" class:selected={story.selected}>
      <div class="avatar-wrapper" class:unread={story.unread}>
        <img src={story.image} alt={story.title} class="avatar" />
      </div>
      <span class="story-title">{story.title}</span>
    </button>
  {/each}
</div>

<style>
  .stories-container {
    display: flex;
    overflow-x: auto;
    padding: 1.5rem 1rem;
    gap: 1.25rem;
    background-color: var(--color-background);
    /* For smooth scrolling */
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  .story-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    min-width: 64px;
    padding: 0;
  }

  .avatar-wrapper {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    padding: 3px; /* Space for the border */
    background: white; /* default background */
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  }
  
  .story-item:hover .avatar-wrapper {
    transform: scale(1.05);
  }

  /* The selected state is a dark circle with white text, 
     but in the screenshot "For you" is a dark bubble entirely. 
     Let's adjust it to match. */
  .story-item.selected .avatar-wrapper {
    background-color: #222;
    padding: 0;
  }
  
  .story-item.selected .avatar {
    opacity: 0.8;
  }

  .story-item.selected .story-title {
    font-weight: 700;
  }

  /* Unread indicator (orange border/dot in screenshot) */
  .avatar-wrapper.unread {
    background: linear-gradient(45deg, var(--color-primary), #ffa85c);
  }

  .avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    border: 2px solid white; /* Inner border to separate image from colored ring */
  }
  
  .story-item.selected .avatar {
    border: none;
  }

  .story-title {
    font-size: 0.75rem;
    color: var(--color-text);
    font-weight: 500;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';

  let { highlights = [] } = $props<{ highlights?: any[] }>();
  let carousel: HTMLElement;

  onMount(() => {
    if (highlights.length <= 1) return;

    const interval = setInterval(() => {
      if (!carousel) return;
      
      const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
      
      // If we've reached the end (with a small 5px buffer for rounding errors)
      if (carousel.scrollLeft >= maxScrollLeft - 5) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const cardWidth = carousel.children[0]?.clientWidth || 0;
        carousel.scrollBy({ left: cardWidth + 16, behavior: 'smooth' }); // +16 for the gap
      }
    }, 3000); // scrolls every 3 seconds

    return () => clearInterval(interval);
  });
</script>

<div class="highlights-carousel" bind:this={carousel}>
  {#each highlights as item}
    <a href={`#${item.id}`} class="highlight-card">
      <img src={item.image} alt={item.title} class="card-bg" />
      <div class="card-overlay"></div>
      <span class="card-title">{item.title}</span>
    </a>
  {/each}
</div>

<style>
  .highlights-carousel {
    display: flex;
    overflow-x: auto;
    gap: 1rem;
    padding: 0 1rem 1rem;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
    /* Hide scrollbar */
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  
  .highlights-carousel::-webkit-scrollbar {
    display: none;
  }

  .highlight-card {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    height: 180px;
    flex: 0 0 45%; /* takes up 45% of container width so next item peeks */
    min-width: 140px;
    display: block;
    text-decoration: none;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    transition: transform 0.2s;
    scroll-snap-align: start;
  }

  .highlight-card:active {
    transform: scale(0.97);
  }

  .card-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .card-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
    pointer-events: none;
  }

  .card-title {
    position: absolute;
    bottom: 0.75rem;
    left: 1rem;
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
    z-index: 1;
  }
</style>

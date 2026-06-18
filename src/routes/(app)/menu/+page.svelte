<script lang="ts">
  let { data } = $props();
  let menuItems = $derived(data.menuItems || []);
</script>

<div class="scrollable-content hide-scrollbar" style="padding: 1.5rem 1rem; width: 100%; max-width: 600px; margin: 0 auto;">
  <div style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
    <h1 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e293b;">Our Menu</h1>
  </div>
  
  {#if menuItems.length === 0}
    <div style="background: white; border-radius: 16px; padding: 3rem 1rem; text-align: center; color: #64748b; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      No menu items available right now. Check back later!
    </div>
  {:else}
    <div class="menu-grid">
      {#each menuItems as item}
        <a href={`/menu/${item.id}`} class="menu-card">
          <div class="image-container">
            <img src={item.image_url || '/dummy image 3.jpeg'} alt={item.name} />
          </div>
          <div class="card-content">
            <span class="category">{item.category}</span>
            <h3 class="name">{item.name}</h3>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
  }

  .menu-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    flex-direction: column;
    border: 1px solid #f1f5f9;
  }
  
  .menu-card:active {
    transform: scale(0.97);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .image-container {
    width: 100%;
    aspect-ratio: 1.2 / 1;
    overflow: hidden;
    background: #f8fafc;
  }

  .image-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-content {
    padding: 0.75rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .category {
    font-size: 0.65rem;
    color: #f07122;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .name {
    margin: 0.25rem 0 0 0;
    font-size: 0.95rem;
    line-height: 1.2;
    font-weight: 600;
    color: #1e293b;
  }
</style>

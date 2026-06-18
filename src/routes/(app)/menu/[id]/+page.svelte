<script lang="ts">
  let { data } = $props();
  let item = $derived(data.menuItem);
  
  function parseLines(text: string) {
    if (!text) return [];
    return text.split('\n').filter(l => l.trim() !== '');
  }
</script>

<div class="menu-detail-container hide-scrollbar" style="width: 100%; max-width: 600px; margin: 0 auto; min-height: 100vh; background: #fff; padding-bottom: 2rem;">
  <div class="header-image-container">
    <img src={item.image_url || '/dummy image 3.jpeg'} alt={item.name} class="header-image" />
    
    <div class="nav-overlay">
      <a href="/menu" class="icon-button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
      </a>
    </div>
  </div>
  
  <div class="content-sheet">
    <h1 class="item-name">🍗 {item.name}</h1>
    
    <div class="brand-separator">
      <h2 class="brand-text">{item.category || 'MENU ITEM'}</h2>
      <div class="brand-line"></div>
    </div>
    
    {#if item.description}
      <p style="color: #64748b; font-size: 0.95rem; line-height: 1.5; margin-bottom: 2rem;">
        {item.description}
      </p>
    {/if}

    {#if item.ingredients}
      <section class="recipe-section">
        <h3 class="section-title">Ingredients (Pre-Prepared)</h3>
        <ul class="recipe-list">
          {#each parseLines(item.ingredients) as line}
            <li>{line.replace(/^•\s*/, '').trim()}</li>
          {/each}
        </ul>
      </section>
    {/if}
    
    {#if item.preparation_steps}
      <section class="recipe-section">
        <h3 class="section-title">Preparation Steps</h3>
        
        {#each parseLines(item.preparation_steps) as line}
          {#if line.startsWith('•') || line.startsWith('-')}
            <ul class="recipe-list" style="margin-top: 0.25rem; margin-bottom: 0.25rem;">
              <li>{line.replace(/^[•-]\s*/, '').trim()}</li>
            </ul>
          {:else}
            <h4 class="sub-step-title">{line.trim()}</h4>
          {/if}
        {/each}
      </section>
    {/if}
  </div>
</div>

<style>
  .header-image-container {
    position: relative;
    width: 100%;
    height: 280px;
    background: #f1f5f9;
  }

  .header-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .nav-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%);
  }

  .icon-button {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1e293b;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  }

  .content-sheet {
    background: white;
    padding: 1.5rem 1rem;
  }

  .item-name {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
  }

  .brand-separator {
    margin: 1.25rem 0;
    position: relative;
  }

  .brand-text {
    color: #f07122;
    font-weight: 700;
    font-size: 1.1rem;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .brand-line {
    height: 2px;
    background: #f07122;
    width: 100%;
    margin-top: 0.25rem;
  }

  .recipe-section {
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.75rem 0;
  }

  .recipe-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .recipe-list li {
    position: relative;
    padding-left: 1.25rem;
    margin-bottom: 0.5rem;
    color: #334155;
    line-height: 1.5;
    font-size: 0.95rem;
  }

  .recipe-list li::before {
    content: "•";
    color: #f07122;
    position: absolute;
    left: 0;
    font-weight: bold;
    font-size: 1.2rem;
    line-height: 1;
    top: -2px;
  }

  .sub-step-title {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    margin: 1.25rem 0 0.5rem 0;
  }
</style>

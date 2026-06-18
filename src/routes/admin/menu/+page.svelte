<script lang="ts">
  import { enhance } from '$app/forms';
  import { confirmSubmit } from '$lib/admin/ux';
  
  let { data, form } = $props();
  
  let menuItems = $state(data.menuItems || []);
  let menuDraggingId = $state<string | null>(null);
  let isGeneratingRecipe = $state(false);
  let isLoading = $state(false);
  let createPanel = $state<HTMLDetailsElement | null>(null);

  // Sync menu items if data loads
  $effect(() => {
    menuItems = data.menuItems || [];
  });

  // Drag and drop handlers
  function handleMenuDragStart(e: DragEvent, id: string) {
    menuDraggingId = id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleMenuDragEnd() {
    menuDraggingId = null;
  }

  function handleMenuDragOver(e: DragEvent, targetId: string) {
    e.preventDefault();
    if (!menuDraggingId || menuDraggingId === targetId) return;

    const draggingIndex = menuItems.findIndex(i => i.id === menuDraggingId);
    const targetIndex = menuItems.findIndex(i => i.id === targetId);

    if (draggingIndex !== -1 && targetIndex !== -1) {
      const newItems = [...menuItems];
      const [draggedItem] = newItems.splice(draggingIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);
      menuItems = newItems;
    }
  }

  // Save the reordered menu items to the database
  async function saveMenuOrder() {
    const orderedIds = menuItems.map(item => item.id);
    const formData = new FormData();
    formData.append('orderedIds', JSON.stringify(orderedIds));

    try {
      const res = await fetch('?/reorder', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert('Menu order saved successfully!');
      } else {
        alert('Failed to save menu order.');
      }
    } catch (err) {
      console.error('Failed to save menu order', err);
      alert('Error saving menu order.');
    }
  }

  // AI Recipe generation
  async function generateRecipe() {
    const nameInput = document.getElementById('menu_name') as HTMLInputElement;
    const name = nameInput?.value;
    
    if (!name) {
      alert('Please enter a Menu Name first!');
      return;
    }

    isGeneratingRecipe = true;
    try {
      const res = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      const resData = await res.json();
      
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to generate recipe');
      }
      
      const ingredientsInput = document.getElementById('menu_ingredients') as HTMLTextAreaElement;
      const stepsInput = document.getElementById('menu_preparation_steps') as HTMLTextAreaElement;
      
      if (ingredientsInput) ingredientsInput.value = resData.ingredients || '';
      if (stepsInput) stepsInput.value = resData.preparation_steps || '';
      
    } catch (err: any) {
      console.error(err);
      alert(`Failed to generate recipe: ${err.message}`);
    } finally {
      isGeneratingRecipe = false;
    }
  }
</script>

<div class="page-head">
  <div>
    <h1>Menu Management</h1>
    <p>Add, edit, reorder, and configure menu items. AI can automatically draft ingredient lists and step-by-step recipes.</p>
  </div>
</div>

<details class="create-panel" bind:this={createPanel}>
  <summary>+ Add menu item</summary>
  <div class="panel-body">
    {#if form?.message}<div class="alert error">{form.message}</div>{/if}
    {#if form?.success}<div class="alert success">Menu item successfully added!</div>{/if}
    
    <form 
      method="POST" 
      action="?/create" 
      enctype="multipart/form-data"
      use:enhance={() => {
        isLoading = true;
        return async ({ update }) => {
          await update();
          isLoading = false;
          if (createPanel) createPanel.open = false;
        };
      }}
    >
      <div class="form-grid">
        <label class="field">
          <span>Name *</span>
          <input type="text" id="menu_name" name="name" required placeholder="e.g. Classic Chicken Sandwich" />
        </label>
        
        <label class="field">
          <span>Category *</span>
          <input type="text" id="menu_category" name="category" placeholder="e.g. Sandwiches" required />
        </label>
        
        <label class="field">
          <span>Item Photo (Upload)</span>
          <input type="file" id="menu_image_file" name="image_file" accept="image/*" />
        </label>
        
        <label class="field">
          <span>Or Photo URL</span>
          <input type="text" id="menu_image_url" name="image_url" placeholder="e.g. /dummy image 3.jpeg" />
        </label>
      </div>

      <div class="form-grid" style="grid-template-columns: 1fr; margin-top: 1rem;">
        <label class="field">
          <span>Description (Customer-facing copy)</span>
          <textarea id="menu_description" name="description" rows="2" placeholder="A juicy chicken breast fillet..."></textarea>
        </label>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; margin-bottom: 0.5rem;">
        <span style="font-weight: 600; font-size: 0.95rem;">Recipe Details</span>
        <button type="button" class="btn" style="background-color: #8b5cf6; color: white;" onclick={generateRecipe} disabled={isGeneratingRecipe}>
          {isGeneratingRecipe ? 'Generating...' : 'Auto-Generate Recipe with AI ✨'}
        </button>
      </div>

      <div class="form-grid" style="grid-template-columns: 1fr;">
        <label class="field">
          <span>Ingredients (Pre-Prepared / Portion size)</span>
          <textarea id="menu_ingredients" name="ingredients" rows="4" placeholder="• Cooked, breaded chicken filet&#10;• Brioche bun&#10;• Pickles"></textarea>
        </label>
        
        <label class="field">
          <span>Preparation Steps</span>
          <textarea id="menu_preparation_steps" name="preparation_steps" rows="6" placeholder="Chicken&#10;• Take from approved holding unit..."></textarea>
        </label>
      </div>

      <div class="form-actions" style="margin-top: 1.5rem;">
        <button class="btn primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Menu Item'}
        </button>
      </div>
    </form>
  </div>
</details>

<div class="card">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
    <h2>Existing Menu Items (Drag rows to reorder)</h2>
    <button class="btn primary" onclick={saveMenuOrder}>Save Order</button>
  </div>
  
  {#if menuItems.length === 0}
    <div class="empty">No menu items found.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width: 40px;"></th>
            <th style="width: 80px;">Photo</th>
            <th>Name</th>
            <th>Category</th>
            <th>Description</th>
            <th style="width: 100px;"></th>
          </tr>
        </thead>
        <tbody>
          {#each menuItems as item (item.id)}
            <tr 
              class={menuDraggingId === item.id ? 'opacity-40' : ''}
              draggable="true"
              ondragstart={(e) => handleMenuDragStart(e, item.id)}
              ondragend={handleMenuDragEnd}
              ondragover={(e) => handleMenuDragOver(e, item.id)}
              style="cursor: grab;"
            >
              <td style="text-align: center; vertical-align: middle; color: #94a3b8;">
                ☰
              </td>
              <td>
                <div class="avatar-sm" style="border-radius: 6px; width: 48px; height: 48px; overflow: hidden; background: #f1f5f9;">
                  <img src={item.image_url || '/dummy image 3.jpeg'} alt="" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
              </td>
              <td class="font-semibold">{item.name}</td>
              <td><span class="badge gray">{item.category}</span></td>
              <td class="muted" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {item.description || '—'}
              </td>
              <td>
                <form 
                  method="POST" 
                  action="?/delete" 
                  use:enhance 
                  onsubmit={confirmSubmit(`Delete ${item.name}? This will remove it from the menu.`)}
                >
                  <input type="hidden" name="itemId" value={item.id} />
                  <button class="btn sm danger" type="submit">Delete</button>
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

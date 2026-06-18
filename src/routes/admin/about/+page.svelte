<script lang="ts">
  import { enhance } from '$app/forms';
  import { confirmSubmit } from '$lib/admin/ux';
  
  let { data, form } = $props();
  
  let aboutUsContent = $state(data.aboutUsContent || []);
  let draggingId = $state<string | null>(null);
  let isVideoSelect = $state('false');
  let isLoading = $state(false);
  let createPanel = $state<HTMLDetailsElement | null>(null);

  // Sync state
  $effect(() => {
    aboutUsContent = data.aboutUsContent || [];
  });

  // Drag and drop handlers
  function handleDragStart(e: DragEvent, id: string) {
    draggingId = id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragEnd() {
    draggingId = null;
  }

  function handleDragOver(e: DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const draggingIndex = aboutUsContent.findIndex(i => i.id === draggingId);
    const targetIndex = aboutUsContent.findIndex(i => i.id === targetId);

    if (draggingIndex !== -1 && targetIndex !== -1) {
      const newItems = [...aboutUsContent];
      const [draggedItem] = newItems.splice(draggingIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);
      aboutUsContent = newItems;
    }
  }

  // Save the reordered timeline content list
  async function saveOrder() {
    const orderedIds = aboutUsContent.map(item => item.id);
    const formData = new FormData();
    formData.append('orderedIds', JSON.stringify(orderedIds));

    try {
      const res = await fetch('?/reorder', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert('Order saved successfully!');
      } else {
        alert('Failed to save order.');
      }
    } catch (err) {
      console.error('Failed to save order', err);
      alert('Error saving order.');
    }
  }
</script>

<div class="page-head">
  <div>
    <h1>A Bit About Us</h1>
    <p>Configure the timeline nodes for the employee onboarding flow. Add reading articles, training links, or popup video overlays.</p>
  </div>
</div>

<details class="create-panel" bind:this={createPanel}>
  <summary>+ Add timeline node</summary>
  <div class="panel-body">
    {#if form?.message}<div class="alert error">{form.message}</div>{/if}
    {#if form?.success}<div class="alert success">Timeline node successfully added!</div>{/if}
    
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
          <span>Title *</span>
          <input type="text" name="title" required placeholder="e.g. The Origins of Popeyes" />
        </label>
        
        <label class="field">
          <span>Content Type</span>
          <select name="type">
            <option value="Article">Article</option>
            <option value="Video">Video</option>
          </select>
        </label>
        
        <label class="field">
          <span>Is it a Video Overlay?</span>
          <select name="is_video" bind:value={isVideoSelect}>
            <option value="false">No (Normal link/Article)</option>
            <option value="true">Yes (Overlay video popup)</option>
          </select>
        </label>
        
        <label class="field">
          <span>Estimated Time</span>
          <input type="text" name="time_read" required placeholder="e.g. 3 min" value="3 min" />
        </label>
      </div>

      <div class="form-grid">
        <label class="field">
          <span>Thumbnail Image (File)</span>
          <input type="file" name="image_file" accept="image/*" />
        </label>
        
        <label class="field">
          <span>Or Image URL</span>
          <input type="text" name="image_url" placeholder="e.g. /dummy image 2.jpg" />
        </label>
        
        {#if isVideoSelect === 'true'}
          <label class="field">
            <span>Video File (.mp4)</span>
            <input type="file" name="video_file" accept="video/*" />
          </label>
          
          <label class="field">
            <span>Or Video URL</span>
            <input type="text" name="video_url" placeholder="e.g. /dummy video.mp4" />
          </label>
        {:else}
          <label class="field" style="grid-column: span 2;">
            <span>External/App Link (Redirect path)</span>
            <input type="text" name="link" placeholder="e.g. /hub/story/origins" />
          </label>
        {/if}
      </div>

      {#if isVideoSelect === 'false'}
        <div class="form-grid" style="grid-template-columns: 1fr; margin-top: 1rem;">
          <label class="field">
            <span>Article Content (Optional - if written, creates a custom page instead of linking out)</span>
            <textarea name="content_body" rows="6" placeholder="Write your markdown or text article here..."></textarea>
          </label>
        </div>
      {/if}

      <div class="form-actions" style="margin-top: 1.5rem;">
        <button class="btn primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Add Content'}
        </button>
      </div>
    </form>
  </div>
</details>

<div class="card">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
    <h2>Onboarding Timeline Items (Drag rows to reorder)</h2>
    <button class="btn primary" onclick={saveOrder}>Save Order</button>
  </div>
  
  {#if aboutUsContent.length === 0}
    <div class="empty">No timeline content found.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width: 40px;"></th>
            <th style="width: 80px;">Thumbnail</th>
            <th>Title</th>
            <th>Type</th>
            <th>Duration</th>
            <th>Behavior</th>
            <th style="width: 100px;"></th>
          </tr>
        </thead>
        <tbody>
          {#each aboutUsContent as item (item.id)}
            <tr 
              class={draggingId === item.id ? 'opacity-40' : ''}
              draggable="true"
              ondragstart={(e) => handleDragStart(e, item.id)}
              ondragend={handleDragEnd}
              ondragover={(e) => handleDragOver(e, item.id)}
              style="cursor: grab;"
            >
              <td style="text-align: center; vertical-align: middle; color: #94a3b8;">
                ☰
              </td>
              <td>
                <div class="avatar-sm" style="border-radius: 6px; width: 48px; height: 48px; overflow: hidden; background: #f1f5f9;">
                  <img src={item.image_url || '/dummy image 2.jpg'} alt="" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
              </td>
              <td class="font-semibold">{item.title}</td>
              <td><span class="badge gray">{item.icon} {item.type}</span></td>
              <td>{item.time_read}</td>
              <td>
                {#if item.is_video}
                  <span class="badge red">Popup Video</span>
                {:else if item.content_body}
                  <span class="badge blue">Written Article</span>
                {:else}
                  <span class="badge gray">Redirect link</span>
                {/if}
              </td>
              <td>
                <form 
                  method="POST" 
                  action="?/delete" 
                  use:enhance 
                  onsubmit={confirmSubmit(`Delete "${item.title}"?`)}
                >
                  <input type="hidden" name="contentId" value={item.id} />
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

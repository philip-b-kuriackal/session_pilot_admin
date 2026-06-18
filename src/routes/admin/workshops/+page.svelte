<script lang="ts">
  import { enhance } from '$app/forms';
  import { confirmSubmit } from '$lib/admin/ux';

  let { data, form } = $props();

  let selectedWorkshopType = $state('In-Person');
  let isLoading = $state(false);
  let createPanel = $state<HTMLDetailsElement | null>(null);

  // Group RSVPs by workshop ID
  function getRsvpsForWorkshop(workshopId: string) {
    return data.rsvps.filter(r => r.workshop_id === workshopId);
  }
</script>

<div class="page-head">
  <div>
    <h1>In Person Workshops</h1>
    <p>Schedule interactive training sessions for your team, track employee RSVP attendance, and manage online video lesson requirements.</p>
  </div>
</div>

<div class="card" style="margin-bottom: 2rem;">
  <h2>Workshop Requirements</h2>
  <p class="muted" style="margin-bottom: 1rem;">Configure how many completed workshops are required for employees to complete their training dashboard milestones.</p>
  <form 
    method="POST" 
    action="?/updateSettings" 
    use:enhance={() => {
      isLoading = true;
      return async ({ update }) => {
        await update();
        isLoading = false;
      };
    }}
  >
    <div style="display: flex; gap: 1rem; align-items: flex-end; max-width: 400px;">
      <label class="field" style="flex-grow: 1; margin: 0;">
        <span>Required Count</span>
        <input type="number" name="required_count" value={data.requiredWorkshops} min="0" required />
      </label>
      <button class="btn primary" type="submit" disabled={isLoading}>Save Setting</button>
    </div>
  </form>
</div>

<details class="create-panel" bind:this={createPanel}>
  <summary>+ Schedule new workshop</summary>
  <div class="panel-body">
    {#if form?.message}<div class="alert error">{form.message}</div>{/if}
    {#if form?.success}<div class="alert success">Workshop successfully scheduled!</div>{/if}
    
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
          <span>Workshop Title *</span>
          <input type="text" name="title" required placeholder="e.g. Health & Safety Protocol" />
        </label>
        
        <label class="field">
          <span>Workshop Type</span>
          <select name="workshop_type" bind:value={selectedWorkshopType}>
            <option value="In-Person">In-Person</option>
            <option value="Online">Online Video / Content Lesson</option>
          </select>
        </label>
        
        <label class="field">
          <span>{selectedWorkshopType === 'Online' ? 'Deadline' : 'Date & Time'} *</span>
          <input type="datetime-local" name="date_time" required />
        </label>
      </div>

      {#if selectedWorkshopType === 'In-Person'}
        <div class="form-grid">
          <label class="field" style="grid-column: span 3;">
            <span>Location / Room *</span>
            <input type="text" name="location" placeholder="e.g. Main Dining Room / Conference Hall" />
          </label>
        </div>
        <div class="form-grid" style="grid-template-columns: 1fr;">
          <label class="field">
            <span>What to Bring (Optional info for employees)</span>
            <textarea name="what_to_bring" rows="2" placeholder="e.g. Bring your uniform, notebook, and pen."></textarea>
          </label>
        </div>
      {:else}
        <div class="form-grid">
          <label class="field">
            <span>Video File (.mp4)</span>
            <input type="file" name="video_file" accept="video/*" />
          </label>
          <label class="field">
            <span>Or Video URL</span>
            <input type="text" name="video_url" placeholder="e.g. /dummy video.mp4" />
          </label>
        </div>
        <div class="form-grid" style="grid-template-columns: 1fr;">
          <label class="field">
            <span>Content / Written Lesson Body</span>
            <textarea name="content_body" rows="4" placeholder="Write text lesson content..."></textarea>
          </label>
        </div>
      {/if}

      <div class="form-grid" style="grid-template-columns: 1fr; margin-top: 1rem;">
        <label class="field">
          <span>Agenda / Schedule Outline (Optional)</span>
          <textarea name="agenda" rows="3" placeholder="e.g.&#10;10:00 AM - Kitchen Safety&#10;11:00 AM - Q&A Session"></textarea>
        </label>
      </div>

      <div class="form-actions" style="margin-top: 1.5rem;">
        <button class="btn primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Scheduling...' : 'Schedule Workshop'}
        </button>
      </div>
    </form>
  </div>
</details>

<div class="card">
  <h2>Manage Workshops</h2>
  
  {#if data.workshops.length === 0}
    <div class="empty">No workshops scheduled yet.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>When</th>
            <th>Location</th>
            <th>RSVPs</th>
            <th>Status</th>
            <th style="width: 180px;"></th>
          </tr>
        </thead>
        <tbody>
          {#each data.workshops as workshop (workshop.id)}
            {@const wsRsvps = getRsvpsForWorkshop(workshop.id)}
            <tr class={workshop.status === 'Completed' ? 'opacity-60' : ''}>
              <td>
                <div class="font-semibold">
                  {workshop.workshop_type === 'Online' ? '💻' : '📅'} {workshop.title}
                </div>
              </td>
              <td><span class="badge gray">{workshop.workshop_type}</span></td>
              <td>{new Date(workshop.date_time).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              <td class="muted">{workshop.location}</td>
              <td>
                {#if wsRsvps.length > 0}
                  <span class="badge blue" title={wsRsvps.map(r => r.employee_name).join(', ')}>
                    {wsRsvps.length} RSVP{wsRsvps.length === 1 ? '' : 's'}
                  </span>
                {:else}
                  <span class="muted">0 RSVPs</span>
                {/if}
              </td>
              <td>
                <span class="badge {workshop.status === 'Completed' ? 'green' : 'orange'}">
                  {workshop.status}
                </span>
              </td>
              <td>
                <div class="row-flex" style="justify-content: flex-end; gap: 0.5rem;">
                  {#if workshop.status !== 'Completed'}
                    <form method="POST" action="?/complete" use:enhance>
                      <input type="hidden" name="workshopId" value={workshop.id} />
                      <button class="btn sm" style="background-color: #10b981; color: white;" type="submit">Complete</button>
                    </form>
                  {/if}
                  <form 
                    method="POST" 
                    action="?/delete" 
                    use:enhance 
                    onsubmit={confirmSubmit(`Cancel and delete the workshop "${workshop.title}"?`)}
                  >
                    <input type="hidden" name="workshopId" value={workshop.id} />
                    <button class="btn sm danger" type="submit">Delete</button>
                  </form>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

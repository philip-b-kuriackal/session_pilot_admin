<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';

  let { show = false, onClose } = $props<{ show: boolean; onClose: () => void }>();
  let loading = $state(false);
  let selectedFileName = $state<string | null>(null);
  let urgent = $state(false);

  const handleSubmit: SubmitFunction = () => {
    loading = true;
    return async ({ result, update }) => {
      loading = false;
      if (result.type === 'success') {
        selectedFileName = null;
        urgent = false;
        onClose();
      }
      await update();
    };
  };

  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      selectedFileName = input.files[0].name;
    } else {
      selectedFileName = null;
    }
  }
</script>

{#if show}
  <div class="modal-backdrop" onclick={onClose} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && onClose()}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2>Create Post</h2>
        <button class="close-btn" onclick={onClose} aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <form method="POST" action="?/createPost" enctype="multipart/form-data" use:enhance={handleSubmit}>
        <textarea 
          name="content" 
          placeholder="What's on your mind?" 
          rows="5" 
          required
          autofocus
        ></textarea>
        
        <!-- Crisis broadcast toggle -->
        <button
          type="button"
          class="urgent-toggle"
          class:on={urgent}
          onclick={() => (urgent = !urgent)}
          aria-pressed={urgent}
        >
          <span class="urgent-icon">🚨</span>
          <span class="urgent-text">
            <span class="urgent-title">Urgent broadcast</span>
            <span class="urgent-sub">
              {urgent
                ? 'Will take over every team member’s screen until they swipe it away'
                : 'For crisis situations — takes over everyone’s screen'}
            </span>
          </span>
          <span class="urgent-switch" class:on={urgent}><span class="knob"></span></span>
        </button>
        <input type="hidden" name="is_urgent" value={urgent ? 'true' : 'false'} />

        {#if selectedFileName}
          <div class="selected-file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
            {selectedFileName}
          </div>
        {/if}

        <div class="modal-actions">
          <div class="media-actions">
            <input 
              type="file" 
              name="media" 
              id="media-upload" 
              accept="image/*,video/*" 
              style="display: none;" 
              onchange={handleFileChange}
            />
            <label for="media-upload" class="media-btn" aria-label="Attach image or video">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </label>
          </div>
          <button type="submit" class="submit-btn" class:urgent disabled={loading}>
            {loading ? 'Posting...' : urgent ? '🚨 Broadcast' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: flex-end; /* Slide up from bottom on mobile */
    justify-content: center;
    backdrop-filter: blur(2px);
  }

  .modal-content {
    background-color: white;
    width: 100%;
    max-width: 600px; /* For larger screens */
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    padding: 24px;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
    animation: slideUp 0.3s ease-out;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .modal-header h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  textarea {
    width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    font-family: inherit;
    font-size: 1rem;
    resize: none;
    outline: none;
    transition: border-color 0.2s;
  }

  textarea:focus {
    border-color: var(--color-primary);
  }

  .selected-file {
    font-size: 0.85rem;
    color: var(--color-primary);
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff0e6;
    padding: 8px 12px;
    border-radius: 8px;
  }

  .modal-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .media-actions {
    display: flex;
  }

  .media-btn {
    color: #6b7280;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .media-btn:hover {
    background-color: #f3f4f6;
    color: var(--color-primary);
  }

  .submit-btn {
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: 24px;
    padding: 12px 32px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .submit-btn:hover:not(:disabled) {
    background-color: var(--color-primary-dark);
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .submit-btn.urgent {
    background-color: #dc2626;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
  }

  /* Urgent toggle row */
  .urgent-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    text-align: left;
    background: #fafafa;
    border: 1px solid #eee;
    border-radius: 12px;
    padding: 12px 14px;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s, border-color 0.15s;
  }

  .urgent-toggle.on {
    background: #fef2f2;
    border-color: #fecaca;
  }

  .urgent-icon { font-size: 1.2rem; }

  .urgent-text { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .urgent-title { font-size: 0.85rem; font-weight: 700; color: #111827; }
  .urgent-toggle.on .urgent-title { color: #b91c1c; }
  .urgent-sub { font-size: 0.72rem; color: #6b7280; }

  .urgent-switch {
    width: 40px;
    height: 23px;
    border-radius: 999px;
    background: #d1d5db;
    position: relative;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .urgent-switch.on { background: #dc2626; }

  .urgent-switch .knob {
    position: absolute;
    top: 2.5px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    transition: transform 0.15s;
  }

  .urgent-switch.on .knob { transform: translateX(16px); }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  /* Adjust for tablet/desktop */
  @media (min-width: 600px) {
    .modal-backdrop {
      align-items: center;
    }
    
    .modal-content {
      border-radius: 24px;
    }
    
    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  }
</style>

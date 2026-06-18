<script lang="ts">
  import { toasts, dismissToast } from '$lib/admin/ux';
  import { fly } from 'svelte/transition';
</script>

<div class="toast-stack" aria-live="polite">
  {#each $toasts as t (t.id)}
    <div class="toast {t.kind}" role="status" transition:fly={{ x: 24, duration: 180 }}>
      <span class="toast-icon">
        {#if t.kind === 'success'}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        {:else if t.kind === 'error'}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {:else}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        {/if}
      </span>
      <span class="toast-msg">{t.message}</span>
      <button class="toast-close" onclick={() => dismissToast(t.id)} aria-label="Dismiss">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  {/each}
</div>

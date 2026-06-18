<script lang="ts">
  import { confirmRequest } from '$lib/admin/ux';
  import { fade, scale } from 'svelte/transition';

  let confirmBtn = $state<HTMLButtonElement | null>(null);

  $effect(() => {
    if ($confirmRequest && confirmBtn) confirmBtn.focus();
  });

  function onKeydown(e: KeyboardEvent) {
    if (!$confirmRequest) return;
    if (e.key === 'Escape') $confirmRequest.resolve(false);
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if $confirmRequest}
  <div
    class="confirm-overlay"
    transition:fade={{ duration: 120 }}
    onclick={(e) => {
      if (e.target === e.currentTarget) $confirmRequest?.resolve(false);
    }}
    role="presentation"
  >
    <div
      class="confirm-card"
      role="alertdialog"
      aria-modal="true"
      aria-label={$confirmRequest.title}
      transition:scale={{ start: 0.96, duration: 140 }}
    >
      <h3>{$confirmRequest.title}</h3>
      <p>{$confirmRequest.message}</p>
      <div class="confirm-actions">
        <button class="btn" onclick={() => $confirmRequest?.resolve(false)}>
          {$confirmRequest.cancelLabel}
        </button>
        <button
          bind:this={confirmBtn}
          class="btn {$confirmRequest.danger ? 'danger-solid' : 'primary'}"
          onclick={() => $confirmRequest?.resolve(true)}
        >
          {$confirmRequest.confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}

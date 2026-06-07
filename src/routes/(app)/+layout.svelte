<script lang="ts">
  import UrgentOverlay from '$lib/components/UrgentOverlay.svelte';
  let { data, children } = $props();
</script>

<div class="mobile-only-warning">
  Please view this application on a mobile device.
</div>

<div class="app-container">
  {@render children()}

  {#if data.urgentPost}
    <UrgentOverlay post={data.urgentPost} />
  {/if}
</div>

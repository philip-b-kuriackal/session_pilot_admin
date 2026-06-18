<script lang="ts">
  import UrgentOverlay from '$lib/app/components/UrgentOverlay.svelte';
  import SideNav from '$lib/app/components/SideNav.svelte';
  let { data, children } = $props();
</script>

<div class="app-shell">
  <SideNav />

  <div class="app-container">
    {@render children()}

    {#if data.urgentPost}
      <UrgentOverlay post={data.urgentPost} />
    {/if}
  </div>
</div>

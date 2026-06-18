<script lang="ts">
  import '$lib/app/app.css';
  let { children } = $props();
</script>

<svelte:head>
  <title>SessionPilot Ops</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
</svelte:head>

{@render children()}

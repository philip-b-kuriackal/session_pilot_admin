<script lang="ts">
  import Header from '$lib/app/components/Header.svelte';
  import TimeClock from '$lib/app/components/TimeClock.svelte';
  import Stories from '$lib/app/components/Stories.svelte';
  import HighlightCards from '$lib/app/components/HighlightCards.svelte';
  import Post from '$lib/app/components/Post.svelte';
  import LearningProgress from '$lib/app/components/LearningProgress.svelte';
  import FloatingActionButton from '$lib/app/components/FloatingActionButton.svelte';
  import BottomNav from '$lib/app/components/BottomNav.svelte';
  import CreatePostModal from '$lib/app/components/CreatePostModal.svelte';
  import { page } from '$app/stores';

  let { data } = $props();
  
  let showPostModal = $state(false);
  
  let stories = $derived(data.stories);
  let highlights = $derived(data.highlights);
  let posts = $derived(data.posts);
  let learningProgress = $derived(data.learningProgress);
</script>

<div class="page-container">
  <Header />
  
  <main class="scrollable-content hide-scrollbar">
    <TimeClock entry={data.openEntry} qrRequired={$page.data.attendanceQrRequired ?? false} />
    <Stories {stories} />
    
    <div class="content-wrapper">
      <HighlightCards {highlights} />
      
      {#each posts as post (post.id)}
        <Post {post} />
      {/each}
      
      <LearningProgress progress={learningProgress} />
      
      <!-- Add a spacer at the bottom so the last content isn't hidden by BottomNav -->
      <div class="bottom-spacer"></div>
    </div>
  </main>
  
  <FloatingActionButton onclick={() => showPostModal = true} />
  <BottomNav />
  
  <CreatePostModal show={showPostModal} onClose={() => showPostModal = false} />
</div>

<style>
  .page-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
    background-color: var(--color-background);
  }

  .content-wrapper {
    display: flex;
    flex-direction: column;
  }

  .bottom-spacer {
    height: 100px; /* Space for the bottom nav and FAB */
  }
</style>

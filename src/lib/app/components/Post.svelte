<script lang="ts">
  import { enhance } from '$app/forms';
  let { post } = $props<{ post: any }>();
  let showReactions = $state(false);
</script>

<div class="post-card">
  <div class="post-header">
    <div class="user-info">
      <img src={post.user.avatar} alt={post.user.name} class="post-avatar" />
      <div class="meta">
        <h3 class="user-name">{post.user.name}</h3>
        <p class="post-time">{post.time} <span class="role">{post.user.role}</span></p>
      </div>
    </div>
    
    <div class="header-actions">
      {#if post.isImportant}
        <span class="tag-important">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M17.5 19c0 1.5-2.5 3-5.5 3s-5.5-1.5-5.5-3c0-2.5 3-4 3-7 0-3-2-5-2-7 0-.5 1-1 3-1 2 0 4 2 5 4s1 5 1 7c0 2 1 2 1 4z"/>
          </svg>
          Important
        </span>
      {/if}
      <button class="menu-btn" aria-label="More options">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </button>
    </div>
  </div>

  <div class="post-content">
    <p>{post.content}</p>
    {#if post.image}
      {#if post.image.match(/\.(mp4|webm|ogg|mov)$/i)}
        <video src={post.image} controls class="post-image" aria-label="Post video"></video>
      {:else}
        <img src={post.image} alt="Post media" class="post-image" />
      {/if}
    {/if}
  </div>

  <div class="post-actions-top">
    <div class="action-group">
      <div class="reaction-container">
        <button class="reaction-btn add-reaction" aria-label="Add reaction" onclick={() => showReactions = !showReactions}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
        </button>

        {#if showReactions}
          <div class="reaction-picker">
            <form method="POST" action="?/addReaction" use:enhance={() => {
              return async ({ update }) => {
                showReactions = false;
                await update({ reset: false });
              };
            }} style="display: flex; gap: 12px; margin: 0;">
              <input type="hidden" name="postId" value={post.id} />
              <button class="emoji-btn" type="submit" name="type" value="heart" aria-label="Heart">❤️</button>
              <button class="emoji-btn" type="submit" name="type" value="thumbsUp" aria-label="Thumbs up">👍</button>
              <button class="emoji-btn" type="submit" name="type" value="celebrate" aria-label="Palm tree">🌴</button>
              <button class="emoji-btn" type="submit" name="type" value="beers" aria-label="Beers">🍻</button>
              <button class="emoji-btn" type="submit" name="type" value="smile" aria-label="Smile">😃</button>
              <button class="emoji-btn" type="submit" name="type" value="laugh" aria-label="Laugh">😂</button>
            </form>
            <button class="emoji-btn add-more" aria-label="Add more">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        {/if}
      </div>
      
      {#if post.reactions?.heart}
        <button class="reaction-btn has-reaction">
          <span class="emoji">❤️</span> {post.reactions.heart}
        </button>
      {/if}
      {#if post.reactions?.smile}
        <button class="reaction-btn has-reaction">
          <span class="emoji">😃</span> {post.reactions.smile}
        </button>
      {/if}
      {#if post.reactions?.celebrate}
        <button class="reaction-btn has-reaction">
          <span class="emoji">🎉</span> {post.reactions.celebrate}
        </button>
      {/if}
      {#if post.reactions?.thumbsUp}
        <button class="reaction-btn has-reaction">
          <span class="emoji">👍</span> {post.reactions.thumbsUp}
        </button>
      {/if}
      {#if post.reactions?.laugh}
        <button class="reaction-btn has-reaction">
          <span class="emoji">😂</span> {post.reactions.laugh}
        </button>
      {/if}
    </div>
    
    {#if post.reactions?.views !== undefined}
      <div class="views">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        {post.reactions.views}
      </div>
    {/if}
  </div>

  <div class="post-actions-bottom">
    <button class="reaction-btn comment-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      {post.reactions?.comments || 0} {post.reactions?.comments === 1 ? 'comment' : 'comments'}
    </button>
  </div>
  
  <div class="add-comment">
    <form method="POST" action="?/addComment" use:enhance={({ formElement }) => {
      return async ({ update }) => {
        formElement.reset();
        await update({ reset: false });
      };
    }}>
      <input type="hidden" name="postId" value={post.id} />
      <input type="text" name="content" placeholder="Add a comment" required />
      <button type="submit" style="display: none;">Submit</button>
    </form>
  </div>

  {#if post.reactions?.commentList && post.reactions.commentList.length > 0}
    <div class="comments-section">
      {#each post.reactions.commentList as comment}
        <div class="comment">
          <img src={comment.userAvatar || '/dmmy%20image.jpg'} alt={comment.userName} class="comment-avatar" />
          <div class="comment-content-box">
            <div class="comment-header">
              <span class="comment-author">{comment.userName}</span>
              <span class="comment-time">{comment.time}</span>
            </div>
            <p class="comment-text">{comment.text}</p>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .post-card {
    background: var(--color-surface);
    padding: 1.25rem 1rem;
    border-top: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
  }

  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .user-info {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .post-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    background: #eee;
  }

  .user-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .post-time {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .role {
    text-decoration: underline;
    cursor: pointer;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tag-important {
    background-color: var(--color-important-bg);
    color: var(--color-important-text);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .menu-btn {
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
  }

  .post-content {
    margin-bottom: 1rem;
    font-size: 0.95rem;
    color: var(--color-text);
  }

  .post-actions-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .post-actions-bottom {
    margin-bottom: 1rem;
    padding-top: 0.25rem;
  }

  .action-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
    flex: 1;
  }

  .post-image {
    width: calc(100% + 2rem);
    margin-left: -1rem;
    margin-right: -1rem;
    margin-top: 1rem;
    display: block;
    object-fit: cover;
    max-height: 400px;
  }

  .post-content p {
    white-space: pre-wrap;
  }

  .reaction-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .reaction-picker {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    background: var(--color-surface, #fff);
    border-radius: 30px;
    padding: 8px 12px;
    display: flex;
    gap: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 10;
    align-items: center;
    border: 1px solid var(--color-border);
  }

  .emoji-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
    transition: transform 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .emoji-btn:hover {
    transform: scale(1.2);
  }

  .add-more {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-reaction-bg, #f5f5f5);
    color: var(--color-text-muted);
  }

  .reaction-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
  }

  .add-reaction {
    color: #a0a0a0;
    background: #f5f5f5;
    border-radius: 20px;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .has-reaction {
    background: var(--color-reaction-bg);
    padding: 4px 10px;
    border-radius: 20px;
    color: var(--color-text);
    border: 1px solid #e5e5e5;
  }

  .comment-btn {
    margin-left: 0;
  }

  .views {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .add-comment {
    margin-top: 1rem;
  }

  .add-comment input[type="text"] {
    width: 100%;
    border: none;
    background: transparent;
    font-size: 0.9rem;
    color: var(--color-text);
    outline: none;
  }
  
  .add-comment input::placeholder {
    color: var(--color-text-muted);
  }

  .comments-section {
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .comment {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .comment-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    background: #eee;
  }

  .comment-content-box {
    flex: 1;
    background: var(--color-background, #f9fafb);
    padding: 10px 12px;
    border-radius: 12px;
    border-top-left-radius: 4px;
  }

  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .comment-author {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .comment-time {
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }

  .comment-text {
    font-size: 0.85rem;
    color: var(--color-text);
    margin: 0;
    line-height: 1.4;
    white-space: pre-wrap;
  }
</style>

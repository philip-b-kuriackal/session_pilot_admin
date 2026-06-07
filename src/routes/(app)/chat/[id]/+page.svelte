<script lang="ts">
  import { page } from '$app/stores';
  import BottomNav from '$lib/components/BottomNav.svelte';

  const dummyImage = '/dmmy%20image.jpg';
  const dummyImage2 = '/dummy%20image%202.jpg';
  const dummyImage3 = '/dummy%20image%203.jpeg';
  const dummyImage4 = '/dummy%20image%204.jpg';
  const dummyImage5 = '/dummy%20image%205.jpg';
  const aichatbotImage = '/avatar_aichatbot.jpg';
  
  let chatId = $derived($page.params.id);
  
  let chatData: any = $derived(
    chatId === '5' ? {
      name: 'Plymouth 🔥',
      avatar: dummyImage2,
      isGroup: true,
      messages: [
        { type: 'divider', text: '18. Dec. 2025, 09:50' },
        { 
          id: 1, 
          sender: 'them-group', 
          text: 'Hey Plymouth team 👋\n\nBig thanks for the effort this week - I\'ve seen the energy on shift and it really shows. Today let\'s stay sharp, especially during the busy periods.\n\nWhat to focus on:\n• Fast, friendly service at the tills\n• Fresh chicken out at all times\n• Keep the front and BOH clean and stocked\n\nIf you\'re unsure about anything or need support, grab a shift lead straight away — we\'ve got each other\'s backs. Let\'s have a strong one 💪🔥',
          reactions: [{ emoji: '❤️', count: 1 }, { avatar: dummyImage, label: 'L' }, { avatar: dummyImage3, label: 'J' }]
        }
      ]
    } : chatId === '4' ? {
      name: 'Proxie',
      avatar: aichatbotImage,
      isGroup: false,
      isBot: true,
      messages: [
        { type: 'divider', text: '26. Feb. 2026, 16:29' },
        { id: 1, sender: 'me', text: 'Can you give me a guide for a chicken sandwich' },
        { 
          id: 2, 
          sender: 'them', 
          text: 'Yes, Lukas! Here is a guide on how to make a Popeyes Chicken Sandwich:\n\nIngredients (prepared):\n* Cooked, breaded chicken fillet\n* Brioche bun\n* Pickles\n* Signature sauce\n\nInstructions:\n1. Chicken: Take the chicken fillet from the approved storage unit. Check shelf life and quality (must be warm, crispy and within the shelf life).\n2. Bun: Toast the bun according to standard. Keep it warm, not dry (only lightly toasted).\n3. Sauce: Apply the approved amount of sauce to the bun (evenly distributed).\n\nWhat would you like to know more about regarding our sandwich, Lukas? 🤔',
          suggestions: [
            { icon: '📖', emoji: '🍗', text: 'Popeyes Chicken San...' },
            { icon: '📖', emoji: '🍯🔥', text: 'Popeyes Louisiana...' },
            { icon: '📖', emoji: '🔥', text: 'Popeyes Spicy Delux...' }
          ]
        }
      ]
    } : {
      name: chatId === '2' ? 'Ferran Torres' : chatId === '3' ? 'Managers 🤫' : 'Gustav Boysen',
      avatar: chatId === '2' ? dummyImage2 : chatId === '3' ? dummyImage3 : dummyImage,
      isGroup: false,
      messages: [
        { type: 'divider', text: '20. Mar. 2026, 11:28' },
        { id: 1, sender: 'me', text: 'Hey man' },
        { id: 2, sender: 'me', text: 'Enjoy Spain' },
        { id: 3, sender: 'them', image: dummyImage4 },
        { id: 4, sender: 'them', text: 'Thank you Luke, we\'re not complaining 😎🌴' },
        { id: 5, sender: 'them', image: dummyImage5 }
      ]
    }
  );

  let showImageViewer = $state(false);
  let viewingImage = $state('');
  let showUserDetails = $state(false);
  
  function openImage(src: string) {
    viewingImage = src;
    showImageViewer = true;
  }
</script>

<div class="chat-detail-container">
  <header class="chat-header">
    <a href="/chat" class="back-btn">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e66420" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </a>
    <button class="header-info" onclick={() => showUserDetails = true}>
      <img src={chatData.avatar} alt={chatData.name} class="header-avatar" />
      <h2>{chatData.name}</h2>
    </button>
    <button class="header-action-btn">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e66420" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
      </svg>
    </button>
  </header>

  <main class="chat-messages hide-scrollbar">
    {#each chatData.messages as msg}
      {#if msg.type === 'divider'}
        <div class="date-divider">{msg.text}</div>
      {:else}
        <div class="message-row {msg.sender}">
          <div class="message-bubble {msg.sender}">
            {#if msg.image}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
              <img src={msg.image} alt="Message attachment" class="message-image" onclick={() => openImage(msg.image)} />
            {:else}
              <p>{msg.text}</p>
            {/if}
            
            {#if msg.reactions}
              <div class="message-reactions">
                {#each msg.reactions as rx}
                  {#if rx.emoji}
                    <div class="reaction-pill">
                      <span>{rx.emoji}</span>
                    </div>
                  {:else if rx.avatar}
                    <div class="reaction-avatar-wrapper">
                      <img src={rx.avatar} alt="reaction user" />
                    </div>
                  {/if}
                {/each}
              </div>
            {/if}
            
            {#if msg.suggestions}
              <div class="message-suggestions">
                {#each msg.suggestions as suggestion}
                  <button class="suggestion-btn">
                    <span class="suggestion-icon">{suggestion.icon}</span>
                    <span class="suggestion-emoji">{suggestion.emoji}</span>
                    <span class="suggestion-text">{suggestion.text}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    {/each}
    <div class="messages-spacer"></div>
  </main>

  <div class="chat-input-area">
    {#if !chatData.isBot}
      <button class="action-btn circle-orange">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <button class="action-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
      </button>
      <button class="action-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      </button>
      <button class="action-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      </button>
    {/if}
    
    <div class="input-wrapper" style={chatData.isBot ? "margin-left: 0.5rem;" : ""}>
      <input type="text" placeholder="Aa" />
    </div>
    
    <button class="action-btn thumbs-up">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
      </svg>
    </button>
  </div>
  
  <BottomNav />

  {#if showImageViewer}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="image-viewer-overlay">
      <div class="viewer-header">
        <button class="viewer-back-btn" onclick={() => showImageViewer = false}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div class="viewer-info">
          <img src={chatData.avatar} alt={chatData.name} class="viewer-avatar" />
          <div class="viewer-meta">
            <h3>{chatData.name}</h3>
            <span>Fri, 20. Mar</span>
          </div>
        </div>
        <div style="width: 24px;"></div>
      </div>
      
      <div class="viewer-content">
        <img src={viewingImage} alt="Full screen" />
      </div>
      
      <div class="viewer-footer">
        <span class="viewer-user">Lukas Kjelstrup</span>
        <button class="external-link-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
      </div>
    </div>
  {/if}

  {#if showUserDetails}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="user-details-overlay" onclick={() => showUserDetails = false}>
      <div class="user-details-content" onclick={(e) => e.stopPropagation()}>
        <button class="close-details-btn" onclick={() => showUserDetails = false}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e66420" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div class="user-details-header">
          <div class="user-details-avatar-wrapper">
            <img src={chatData.avatar} alt={chatData.name} />
          </div>
          <h2>{chatData.name}</h2>
          
          <div class="user-actions-row">
            <button class="user-action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5c3ab6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Chat</span>
            </button>
            <button class="user-action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5c3ab6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
              </svg>
              <span>Call</span>
            </button>
          </div>
        </div>
        
        <div class="user-tabs">
          <button class="user-tab active">About</button>
          <button class="user-tab">Training Progress</button>
          <button class="user-tab">Shared files</button>
          <button class="user-tab">Links</button>
        </div>
        
        <div class="user-details-body hide-scrollbar">
          <div class="badges-card">
            <div class="badges-text">
              <p>This user has not earned any badges yet.</p>
            </div>
            <div class="badges-illustration">
              <!-- Placeholder for illustration -->
              <div class="illustration-placeholder">🏆</div>
            </div>
          </div>
          
          <div class="user-info-section">
            <div class="info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div class="info-content">
              <span class="info-label">Role</span>
              <div class="pill-group">
                <span class="pill blue">Assistant General Manager</span>
                <span class="pill blue">Team Member</span>
                <span class="pill blue">Shift Manager</span>
                <span class="pill blue">General Manager</span>
                <span class="pill pink">Plymouth</span>
                <span class="pill pink">Woolwich</span>
                <span class="pill pink">Northampton</span>
                <span class="pill pink">Barnsley</span>
              </div>
            </div>
          </div>
          
          <div class="user-info-section">
            <div class="info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="info-content">
              <span class="info-label">Joined</span>
              <span class="info-value">Mar, 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .chat-detail-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    background-color: var(--color-background, #fff);
  }

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    padding-top: calc(1rem + env(safe-area-inset-top));
    border-bottom: 1px solid var(--color-border, #eee);
    background-color: var(--color-surface, #fff);
    z-index: 10;
  }

  .back-btn, .header-action-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .header-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
  }

  .header-info h2 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-text);
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .date-divider {
    text-align: center;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin: 0.5rem 0;
  }

  .message-row {
    display: flex;
    width: 100%;
  }

  .message-row.me {
    justify-content: flex-end;
  }

  .message-row.them {
    justify-content: flex-start;
  }
  
  .message-row.them-group {
    justify-content: flex-start;
  }

  .message-bubble {
    max-width: 80%;
    border-radius: 18px;
    position: relative;
  }

  .message-bubble p {
    margin: 0;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    white-space: pre-wrap;
    line-height: 1.4;
  }

  .message-bubble.me {
    background-color: #e66420;
    color: white;
    border-bottom-right-radius: 4px;
  }

  .message-bubble.them {
    background-color: #f3f4f6;
    color: black;
    border-bottom-left-radius: 4px;
  }
  
  .message-bubble.them-group {
    background-color: #e66420;
    color: white;
    max-width: 90%;
    border-radius: 12px;
  }
  
  :global(body.dark) .message-bubble.them {
    background-color: #2a2a2a;
    color: white;
  }

  .message-image {
    width: 100%;
    border-radius: 12px;
    display: block;
    cursor: zoom-in;
  }

  .message-reactions {
    position: absolute;
    bottom: -16px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--color-surface, #fff);
    border-radius: 20px;
    padding: 2px 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .message-suggestions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0 1rem 0.75rem;
  }

  .suggestion-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 12px;
    padding: 0.75rem 1rem;
    text-align: left;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: background-color 0.2s;
  }

  :global(body.dark) .suggestion-btn {
    background-color: #333;
    border-color: #444;
  }

  .suggestion-icon {
    font-size: 1.1rem;
  }

  .suggestion-emoji {
    font-size: 1.1rem;
  }

  .suggestion-text {
    font-size: 0.9rem;
    color: var(--color-text);
    font-weight: 500;
  }

  .reaction-pill {
    background-color: #fce8df;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
  }

  .reaction-avatar-wrapper img {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid white;
  }

  .chat-input-area {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background-color: var(--color-surface, #fff);
    border-top: 1px solid var(--color-border, #eee);
    z-index: 10;
    margin-bottom: 60px; /* Space for bottom nav */
  }

  .action-btn {
    background: none;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .circle-orange {
    background-color: #e66420;
    border-radius: 50%;
    width: 24px;
    height: 24px;
  }

  .input-wrapper {
    flex: 1;
    background-color: #f3f4f6;
    border-radius: 20px;
    padding: 0.5rem 1rem;
    border: 1px solid #e5e7eb;
  }

  :global(body.dark) .input-wrapper {
    background-color: #2a2a2a;
    border-color: #444;
  }

  .input-wrapper input {
    border: none;
    background: transparent;
    width: 100%;
    font-size: 0.95rem;
    outline: none;
    color: var(--color-text);
  }

  .messages-spacer {
    height: 20px;
  }

  /* Full Screen Image Viewer */
  .image-viewer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000;
    z-index: 1000;
    display: flex;
    flex-direction: column;
  }

  .viewer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem;
    padding-top: calc(1.25rem + env(safe-area-inset-top));
  }

  .viewer-back-btn, .external-link-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
  }

  .viewer-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .viewer-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  .viewer-meta {
    display: flex;
    flex-direction: column;
    color: white;
  }

  .viewer-meta h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
  }

  .viewer-meta span {
    font-size: 0.75rem;
    color: #aaa;
  }

  .viewer-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .viewer-content img {
    width: 100%;
    height: auto;
    max-height: 100%;
    object-fit: contain;
  }

  .viewer-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem;
    padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));
  }

  .viewer-user {
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
  }

  /* User Details Overlay */
  .user-details-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.4);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  
  .user-details-content {
    background-color: var(--color-surface, #fff);
    height: 95%;
    border-top-left-radius: 32px;
    border-top-right-radius: 32px;
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  }
  
  .close-details-btn {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
  
  .user-details-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 1.25rem 1.5rem;
  }
  
  .user-details-avatar-wrapper {
    width: 100px;
    height: 100px;
    background-color: #d8e4db;
    border-radius: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    overflow: hidden;
  }
  
  .user-details-avatar-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .user-details-header h2 {
    font-size: 1.6rem;
    font-weight: 700;
    margin: 0 0 1.25rem 0;
    color: var(--color-text);
  }
  
  .user-actions-row {
    display: flex;
    gap: 1rem;
  }
  
  .user-action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #f3f0fc;
    color: #5c3ab6;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
  }
  
  :global(body.dark) .user-action-btn {
    background-color: #2a2046;
    color: #bfa6ff;
  }

  .user-tabs {
    display: flex;
    gap: 1.5rem;
    padding: 0 1.25rem 1rem;
    overflow-x: auto;
    border-bottom: 1px solid var(--color-border, #eee);
  }
  
  .user-tab {
    background: none;
    border: none;
    font-size: 0.95rem;
    color: var(--color-text-muted);
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    cursor: pointer;
    white-space: nowrap;
  }
  
  .user-tab.active {
    background-color: var(--color-text);
    color: var(--color-background);
  }
  
  .user-details-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .badges-card {
    background-color: var(--color-background, #f9f9f9);
    border-radius: 16px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid var(--color-border, transparent);
  }
  
  .badges-text p {
    color: var(--color-text-muted);
    font-size: 0.95rem;
    margin: 0;
    max-width: 150px;
    line-height: 1.4;
  }
  
  .badges-illustration {
    width: 100px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .illustration-placeholder {
    font-size: 3rem;
  }
  
  .user-info-section {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .info-icon {
    width: 40px;
    height: 40px;
    background-color: var(--color-background, #f5f5f5);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .info-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .info-label {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
  
  .info-value {
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text);
  }
  
  .pill-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
  
  .pill {
    padding: 0.4rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  .pill.blue {
    background-color: #cffafe;
    color: #0891b2;
  }
  
  .pill.pink {
    background-color: #fce7f3;
    color: #db2777;
  }
</style>

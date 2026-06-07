<script lang="ts">
  import BottomNav from '$lib/components/BottomNav.svelte';

  const dummyImage = '/dmmy%20image.jpg';
  const dummyImage2 = '/dummy%20image%202.jpg';
  const dummyImage3 = '/dummy%20image%203.jpeg';
  const aichatbotImage = '/avatar_aichatbot.jpg';

  let showProfilePopup = $state(false);
  let activePopupView = $state('profile');
  let selectedSchedule = $state("Every day");
  const scheduleOptions = ['Every day', 'Weekdays', 'Custom', 'No Schedule'];
  let selectedClearStatus = $state("Don't clear");
  const clearStatusOptions = ['Don\'t clear', '30 minutes', '1 hour', '4 hours', 'Today', 'This week', 'Choose date and time'];

  let activeChats = [
    { id: 1, name: 'Proxie', image: aichatbotImage, online: true },
    { id: 2, name: 'Ferran...', image: dummyImage2 },
    { id: 3, name: 'Manag...', image: dummyImage3 },
    { id: 4, name: 'Gustav...', image: dummyImage },
    { id: 5, name: 'Plymo...', image: dummyImage2 }
  ];

  let chats = [
    {
      id: 1,
      name: 'Gustav Boysen',
      avatar: dummyImage,
      message: 'Well done on your shift yesterday!',
      time: '11:13'
    },
    {
      id: 2,
      name: 'Ferran Torres',
      avatar: dummyImage2,
      message: 'You sent an attachment',
      time: '31 Mar'
    },
    {
      id: 3,
      name: 'Managers 🤫',
      avatar: dummyImage3,
      message: 'Phil: Not sure if intentional or not',
      time: '9 Mar'
    },
    {
      id: 4,
      name: 'Proxie',
      avatar: aichatbotImage,
      message: '📄 Yes, Lukas! Here is a guide on how...',
      time: '28 Feb'
    },
    {
      id: 5,
      name: 'Plymouth 🔥',
      avatar: dummyImage2,
      message: 'Hey Plymouth team 👋',
      time: '18 Dec 25'
    },
    {
      id: 6,
      name: 'Besties 😝',
      avatar: dummyImage3,
      message: 'Draft: Hey team!',
      time: '',
      isDraft: true
    }
  ];

  let filters = ['All', 'Unread', 'Groups', 'Archived'];
  let activeFilter = 'All';
</script>

<div class="page-container">
  <header class="chat-header">
    <h1>Messages</h1>
    <div class="header-actions">
      <button class="new-message-btn" aria-label="New message">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <button class="profile-wrapper" onclick={() => { showProfilePopup = true; activePopupView = 'profile'; }} aria-label="Open profile">
        <img src={dummyImage} alt="Profile" class="profile-avatar" />
        <div class="add-story-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
      </button>
    </div>
  </header>

  <main class="scrollable-content hide-scrollbar">
    <div class="search-container">
      <div class="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" placeholder="Search" />
      </div>
    </div>

    <div class="filters">
      {#each filters as filter}
        <button 
          class="filter-pill" 
          class:active={activeFilter === filter}
          onclick={() => activeFilter = filter}
        >
          {filter}
        </button>
      {/each}
    </div>

    <div class="active-chats hide-scrollbar">
      {#each activeChats as active}
        <div class="active-chat-item">
          <div class="avatar-wrapper">
            <img src={active.image} alt={active.name} />
            {#if active.online}
              <div class="online-indicator"></div>
            {/if}
          </div>
          <span class="name">{active.name}</span>
        </div>
      {/each}
    </div>

    <div class="chat-list">
      {#each chats as chat}
        <a href="/chat/{chat.id}" class="chat-item" style="text-decoration: none;">
          <img src={chat.avatar} alt={chat.name} class="chat-avatar" />
          <div class="chat-content">
            <div class="chat-header-row">
              <h3 class="chat-name">{chat.name}</h3>
              {#if chat.time}
                <span class="chat-time">{chat.time}</span>
              {/if}
            </div>
            <p class="chat-message">
              {#if chat.isDraft}
                <strong>Draft:</strong>
              {/if}
              {chat.message}
            </p>
          </div>
        </a>
      {/each}
    </div>
    
    <div class="bottom-spacer"></div>
  </main>
  
  <BottomNav />
  
  {#if showProfilePopup}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="popup-overlay" onclick={() => showProfilePopup = false}>
      <div class="popup-content" onclick={(e) => e.stopPropagation()}>
        {#if activePopupView === 'profile'}
          <div class="popup-header">
            <button class="icon-btn" onclick={() => showProfilePopup = false}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e66420" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h2>You</h2>
            <button class="icon-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          </div>
          
          <div class="popup-user-info">
            <img src={dummyImage} alt="Lukas Kjelstrup" class="popup-avatar" />
            <h3>Lukas Kjelstrup</h3>
          </div>
          
          <div class="status-input">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
            <input type="text" placeholder="What's your status?" />
          </div>
          
          <div class="popup-spacer"></div>
          
          <div class="popup-menu">
            <button class="menu-item" onclick={() => activePopupView = 'clear_status'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Clear status after...</span>
              <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            
            <button class="menu-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                <path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path>
                <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path>
                <path d="M18 8a6 6 0 0 0-9.33-5"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <span>Pause notifications</span>
            </button>
            
            <button class="menu-item" onclick={() => activePopupView = 'schedule'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span>Set notification schedule</span>
              <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        {:else if activePopupView === 'schedule'}
          <div class="schedule-popup">
            <div class="schedule-popup-header">
              <h2 class="schedule-title">Notifications Schedule</h2>
              <p class="schedule-subtitle">You'll only receive notifications during the hours that you select</p>
            </div>

            <div class="schedule-divider" style="margin-top: 1rem;"></div>

            <div class="schedule-options">
              {#each scheduleOptions as option}
                <label class="schedule-option">
                  <span>{option}</span>
                  <div class="radio-wrapper">
                    <input type="radio" name="schedule_option" value={option} bind:group={selectedSchedule} />
                    <div class="custom-radio"></div>
                  </div>
                </label>
              {/each}
              
              <div class="schedule-divider"></div>
              
              <div class="schedule-option time-option">
                <span>Start</span>
                <span class="time-value">9:00</span>
              </div>
              <div class="schedule-option time-option">
                <span>End</span>
                <span class="time-value">17:00</span>
              </div>
            </div>
            
            <div class="schedule-footer">
              <button class="primary-btn">Set schedule</button>
              <button class="dismiss-btn" onclick={() => activePopupView = 'profile'}>Dismiss</button>
            </div>
          </div>
        {:else if activePopupView === 'clear_status'}
          <div class="clear-status-popup" style="display: flex; flex-direction: column; height: 100%;">
            <div class="popup-header">
              <button class="icon-btn" onclick={() => activePopupView = 'profile'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e66420" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <h2 style="font-weight: 500;">Clear status after...</h2>
              <div style="width: 20px;"></div>
            </div>

            <div class="schedule-options">
              {#each clearStatusOptions as option}
                <label class="schedule-option">
                  <span>{option}</span>
                  <div class="radio-wrapper">
                    <input type="radio" name="clear_status" value={option} bind:group={selectedClearStatus} />
                    <div class="custom-radio"></div>
                  </div>
                </label>
              {/each}
            </div>
            
            <div class="popup-spacer"></div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .page-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    background-color: var(--color-background);
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    padding-top: calc(1rem + env(safe-area-inset-top));
    background: var(--color-background);
  }

  .chat-header h1 {
    font-size: 1.75rem;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .new-message-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: var(--color-primary, #e66420);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .profile-wrapper {
    position: relative;
    width: 36px;
    height: 36px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .profile-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .add-story-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    background-color: #e5e7eb;
    border: 2px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4b5563;
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
  }

  .search-container {
    padding: 0 1.25rem 1rem;
  }

  .search-bar {
    display: flex;
    align-items: center;
    background-color: var(--color-surface, #f3f4f6);
    border-radius: 12px;
    padding: 0.5rem 1rem;
    gap: 0.5rem;
    color: var(--color-text-muted);
  }

  .search-bar input {
    border: none;
    background: transparent;
    width: 100%;
    font-size: 0.95rem;
    outline: none;
    color: var(--color-text);
  }

  .filters {
    display: flex;
    gap: 1.5rem;
    padding: 0 1.25rem 1rem;
    overflow-x: auto;
  }

  .filter-pill {
    background: none;
    border: none;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-text-muted);
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    cursor: pointer;
    white-space: nowrap;
  }

  .filter-pill.active {
    background: black;
    color: white;
  }
  
  :global(body.dark) .filter-pill.active {
    background: white;
    color: black;
  }

  .active-chats {
    display: flex;
    gap: 1.25rem;
    padding: 0 1.25rem 1.5rem;
    overflow-x: auto;
  }

  .active-chat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    min-width: 60px;
  }

  .avatar-wrapper {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    padding: 2px;
    background: linear-gradient(45deg, #e66420, #f87171);
  }

  .avatar-wrapper img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--color-background);
  }

  .online-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 14px;
    height: 14px;
    background-color: #22c55e;
    border: 2.5px solid var(--color-background);
    border-radius: 50%;
  }

  .active-chat-item .name {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text);
  }

  .chat-list {
    display: flex;
    flex-direction: column;
  }

  .chat-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1.25rem;
    gap: 1rem;
  }

  .chat-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
  }

  .chat-content {
    flex: 1;
    min-width: 0;
  }

  .chat-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .chat-name {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-time {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .chat-message {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bottom-spacer {
    height: 100px;
  }

  .popup-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    z-index: 100;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .popup-content {
    background-color: var(--color-surface, #fff);
    height: 92%;
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    border-bottom: 1px solid var(--color-border, #eee);
  }

  .popup-header h2 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .popup-user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border-bottom: 1px solid var(--color-border, #eee);
  }

  .popup-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
  }

  .popup-user-info h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .status-input {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem;
    border-bottom: 1px solid var(--color-border, #eee);
    color: var(--color-text-muted);
  }

  .status-input input {
    border: none;
    background: transparent;
    font-size: 1rem;
    width: 100%;
    outline: none;
    color: var(--color-text);
  }

  .popup-spacer {
    flex: 1;
    background: linear-gradient(to bottom, #f9f9f9 0%, #f0f0f0 100%);
  }

  :global(body.dark) .popup-spacer {
    background: linear-gradient(to bottom, #1a1a1a 0%, #111 100%);
  }

  .popup-menu {
    padding: 1rem 1.25rem 2rem;
    background: var(--color-surface, #fff);
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 1rem 0;
    background: none;
    border: none;
    font-size: 1rem;
    color: var(--color-text);
    cursor: pointer;
  }

  .menu-item .chevron {
    margin-left: auto;
    color: var(--color-text-muted);
  }

  .schedule-options {
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
  }

  .schedule-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    cursor: pointer;
  }

  .schedule-option span {
    font-size: 1rem;
    color: var(--color-text);
  }

  .radio-wrapper {
    position: relative;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .radio-wrapper input {
    opacity: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    cursor: pointer;
    margin: 0;
    z-index: 2;
  }

  .custom-radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #ccc;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.2s;
  }

  /* Schedule popup radio color */
  .schedule-popup .radio-wrapper input:checked + .custom-radio {
    border-color: #4f46e5;
  }
  .schedule-popup .radio-wrapper input:checked + .custom-radio::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #4f46e5;
  }

  /* Clear status popup radio color */
  .clear-status-popup .radio-wrapper input:checked + .custom-radio {
    border-color: #e66420;
  }
  .clear-status-popup .radio-wrapper input:checked + .custom-radio::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #e66420;
  }

  .schedule-popup {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .schedule-popup-header {
    padding: 2rem 1.25rem 0.5rem;
  }
  
  .schedule-title {
    font-size: 1.4rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
  }
  
  .schedule-subtitle {
    font-size: 0.95rem;
    color: var(--color-text-muted);
    margin: 0;
    line-height: 1.4;
  }

  .schedule-divider {
    height: 1px;
    background-color: var(--color-border, #eee);
    margin: 0 1.25rem;
  }

  .time-option {
    cursor: default;
  }
  
  .time-value {
    color: var(--color-text);
  }

  .schedule-footer {
    display: flex;
    flex-direction: column;
    padding: 1rem 1.25rem 2.5rem;
    gap: 1rem;
    margin-top: auto;
  }
  
  .primary-btn {
    background-color: #c2185b;
    color: white;
    border: none;
    border-radius: 12px;
    padding: 1rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }
  
  .dismiss-btn {
    background: none;
    border: none;
    color: #c2185b;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0.5rem;
  }
</style>

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let { data } = $props();

  let brandName = $derived($page.data.brandName ?? 'our restaurant');

  let user = $derived.by(() => {
    const p = data.person;
    const joined = p.hire_date ?? p.created_at;
    return {
      name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Team member',
      avatar: p.avatar_url ?? '/avatar_aichatbot.jpg',
      status: p.bio ?? 'Hello there! 👋',
      role: p.position || p.job_role?.name || (p.role ?? '').replaceAll('_', ' '),
      location: p.location?.name ?? '—',
      joined: joined
        ? new Date(joined).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
        : '—'
    };
  });

  const emptyBadgesImg = '/dummy image 5.jpg'; // Placeholder for illustration
  const moduleImg1 = '/dummy image 2.jpg';
  const moduleImg2 = '/dummy image 3.jpeg';
  const moduleImg3 = '/dummy image 4.jpg';

  // State for accordions
  let isWelcomeCourseOpen = $state(true);
  let isModule1Open = $state(true);
</script>

<div class="page-container">
  <div class="scrollable-content hide-scrollbar">
    
    <!-- Hero Section -->
    <div class="hero-section bg-orange">
      
      <!-- Top Actions -->
      <div class="top-actions">
        <button class="action-btn" onclick={() => goto('/directory')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div class="right-actions">
          <button class="action-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <button class="action-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Profile Info -->
      <div class="profile-info">
        <div class="avatar-container">
          <img src={user.avatar} alt={user.name} class="avatar-image" />
        </div>
        
        <h1 class="profile-name">{user.name}</h1>
        
        <div class="status-pill">
          <span class="status-icon">💬</span> {user.status}
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
          <div class="stat-text">
            <span class="stat-label">Role</span>
            <span class="stat-value">{user.role}</span>
          </div>
        </div>
        <div class="stat-item divider">
          <div class="stat-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
          <div class="stat-text">
            <span class="stat-label">Location</span>
            <span class="stat-value">{user.location}</span>
          </div>
        </div>
        <div class="stat-item divider">
          <div class="stat-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg></div>
          <div class="stat-text">
            <span class="stat-label">Joined</span>
            <span class="stat-value">{user.joined}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Content Section -->
    <div class="content-section">
      
      <!-- Earned Badges -->
      <div class="section-block">
        <h2 class="section-title">Earned badges</h2>
        <p class="section-subtitle">Overview of all earned badges</p>
        
        <div class="empty-badges-card">
          <p class="empty-text">This user has not earned any badges yet.</p>
          <div class="empty-illustration">
            <!-- Using a placeholder image since we don't have the exact illustration -->
            <img src={emptyBadgesImg} alt="No badges" style="mix-blend-mode: multiply; opacity: 0.5;" />
          </div>
        </div>
      </div>

      <!-- Training Completed -->
      <div class="section-block">
        <h2 class="section-title">Training completed</h2>
        <p class="section-subtitle">See what has been read so far</p>

        <!-- Course Accordion: Welcome course -->
        <div class="course-group">
          <button class="course-header" onclick={() => isWelcomeCourseOpen = !isWelcomeCourseOpen}>
            <div class="course-info">
              <span class="meta-label">Course</span>
              <span class="course-name">Welcome to {brandName}!</span>
            </div>
            <div class="course-actions">
              <div class="progress-ring pending">25</div>
              <svg class="chevron" class:open={isWelcomeCourseOpen} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </button>

          {#if isWelcomeCourseOpen}
            <div class="course-modules">
              
              <!-- Module 1: A bit about us -->
              <div class="module-group">
                <button class="module-header" onclick={() => isModule1Open = !isModule1Open}>
                  <div class="module-img-wrapper">
                    <img src={moduleImg1} alt="Module thumbnail" />
                  </div>
                  <div class="module-info">
                    <span class="meta-label">Module</span>
                    <span class="module-name">A bit about us...</span>
                  </div>
                  <div class="course-actions">
                    <div class="progress-ring active">80</div>
                    <svg class="chevron" class:open={isModule1Open} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </button>

                {#if isModule1Open}
                  <div class="module-lessons">
                    <div class="lesson-item">
                      <div class="lesson-icon">📖</div>
                      <span class="lesson-name">The Origins of {brandName}</span>
                      <div class="check-circle completed"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    </div>
                    <div class="lesson-item">
                      <div class="lesson-icon">📈</div>
                      <span class="lesson-name">The Growth and Expansion of...</span>
                      <div class="check-circle completed"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    </div>
                    <div class="lesson-item">
                      <div class="lesson-icon">🔮</div>
                      <span class="lesson-name">{brandName} Today and Looking F...</span>
                      <div class="check-circle completed"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    </div>
                    <div class="lesson-item">
                      <div class="lesson-icon">🔥</div>
                      <span class="lesson-name">Surprise Guest</span>
                      <div class="check-circle pending-dash"></div>
                    </div>
                    <div class="lesson-item">
                      <div class="lesson-icon">🤝</div>
                      <span class="lesson-name">Respect and Teamwork at {brandName}</span>
                      <div class="check-circle completed"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    </div>
                  </div>
                {/if}
              </div>

              <!-- Module 2: Our Menu -->
              <div class="module-group">
                <button class="module-header">
                  <div class="module-img-wrapper">
                    <img src={moduleImg2} alt="Module thumbnail" />
                  </div>
                  <div class="module-info">
                    <span class="meta-label">Module</span>
                    <span class="module-name">Our Menu!</span>
                  </div>
                  <div class="course-actions">
                    <div class="progress-ring pending">0</div>
                    <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </button>
              </div>

              <!-- Module 3: In person workshop -->
              <div class="module-group">
                <button class="module-header">
                  <div class="module-img-wrapper">
                    <img src={moduleImg3} alt="Module thumbnail" style="filter: grayscale(100%);" />
                  </div>
                  <div class="module-info">
                    <span class="meta-label">Module</span>
                    <span class="module-name">In person workshop</span>
                  </div>
                  <div class="course-actions">
                    <div class="progress-ring pending">0</div>
                    <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </button>
              </div>

              <!-- Module 4: Before your first shift -->
              <div class="module-group">
                <button class="module-header">
                  <div class="module-img-wrapper">
                    <img src={moduleImg1} alt="Module thumbnail" />
                  </div>
                  <div class="module-info">
                    <span class="meta-label">Module</span>
                    <span class="module-name">Before your first shift...</span>
                  </div>
                  <div class="course-actions">
                    <div class="check-circle completed"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </button>
              </div>

            </div>
          {/if}
        </div>

        <!-- Course Accordion: Breading Masterclass -->
        <div class="course-group">
          <button class="course-header">
            <div class="course-info">
              <span class="meta-label">Course</span>
              <span class="course-name">Breading Masterclass</span>
            </div>
            <div class="course-actions">
              <div class="progress-ring pending">0</div>
              <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </button>
        </div>

      </div>

      <div class="bottom-spacer"></div>
    </div>
  </div>
</div>

<style>
  .page-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-background, #fff);
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
  }

  /* Hero Section */
  .hero-section {
    position: relative;
    padding-bottom: 3rem;
  }
  
  .bg-orange {
    background-color: #f26f21;
    color: white;
  }

  .top-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(1rem + env(safe-area-inset-top)) 1.25rem 1rem;
  }

  .right-actions {
    display: flex;
    gap: 0.75rem;
  }

  .action-btn {
    width: 44px;
    height: 44px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    color: white;
    cursor: pointer;
  }

  /* Profile Info */
  .profile-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-top: 1rem;
  }

  .avatar-container {
    position: relative;
    width: 100px;
    height: 100px;
    margin-bottom: 1rem;
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    border-radius: 32px; /* Squircle */
    object-fit: cover;
    background-color: white;
    border: 4px solid rgba(255, 255, 255, 0.2);
  }

  .avatar-badge {
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    color: #111;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 2px 10px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    white-space: nowrap;
  }

  .profile-name {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
  }

  .status-pill {
    background-color: rgba(255, 255, 255, 0.15);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-icon {
    font-size: 1rem;
  }

  /* Stats Grid */
  .stats-grid {
    display: flex;
    align-items: stretch;
    justify-content: center;
    margin-top: 2rem;
    padding: 0 1rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 1rem;
    text-align: center;
  }

  .stat-item.divider {
    border-left: 1px solid rgba(255, 255, 255, 0.2);
  }

  .stat-icon {
    opacity: 0.8;
    margin-bottom: 0.25rem;
  }

  .stat-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-label {
    font-size: 0.65rem;
    font-weight: 600;
    opacity: 0.8;
  }

  .stat-value {
    font-size: 0.8rem;
    font-weight: 600;
    max-width: 80px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Content Section */
  .content-section {
    position: relative;
    padding: 2rem 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--color-background, #fff);
    border-top-left-radius: 32px;
    border-top-right-radius: 32px;
    margin-top: -32px;
    z-index: 5;
  }

  .section-block {
    margin-bottom: 2.5rem;
  }

  .section-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-text, #111);
    margin: 0 0 0.25rem 0;
  }

  .section-subtitle {
    font-size: 0.85rem;
    color: var(--color-text-muted, #777);
    margin: 0 0 1rem 0;
  }

  /* Empty Badges Card */
  .empty-badges-card {
    background-color: #f8f9fa;
    border-radius: 20px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 100px;
  }

  .empty-text {
    font-size: 0.9rem;
    color: var(--color-text-muted, #666);
    line-height: 1.4;
    max-width: 60%;
    margin: 0;
  }

  .empty-illustration {
    width: 80px;
    height: 80px;
  }
  
  .empty-illustration img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* Training Accordion */
  .course-group {
    background: #fdfdfd;
    border: 1px solid #eee;
    border-radius: 16px;
    margin-bottom: 1rem;
    overflow: hidden;
  }

  .course-header, .module-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .course-info, .module-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .meta-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text-muted, #888);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .course-name {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--color-text, #111);
  }

  .course-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .progress-ring {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .progress-ring.pending {
    border: 2px solid #e2e8f0;
    color: #94a3b8;
  }

  .progress-ring.active {
    border: 2px solid #e66420;
    color: #e66420;
  }

  .check-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .check-circle.completed {
    background-color: #e66420;
  }
  
  .check-circle.completed svg {
    width: 14px;
    height: 14px;
  }

  .check-circle.pending-dash {
    border: 2px dashed #cbd5e1;
  }

  .chevron {
    color: var(--color-text-muted, #999);
    transition: transform 0.2s;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .course-modules {
    padding: 0 0 0.5rem 0;
  }

  .module-group {
    border-top: 1px solid #f5f5f5;
  }

  .module-header {
    padding: 1rem 1.25rem;
  }

  .module-img-wrapper {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    overflow: hidden;
    margin-right: 1rem;
    flex-shrink: 0;
  }

  .module-img-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .module-info {
    flex: 1;
  }

  .module-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text, #111);
  }

  .module-lessons {
    padding: 0.5rem 1.25rem 1.25rem 4.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .lesson-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .lesson-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .lesson-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text, #333);
    flex: 1;
  }

  .bottom-spacer {
    height: 60px;
  }
</style>

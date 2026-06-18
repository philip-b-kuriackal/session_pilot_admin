<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let { data } = $props();

  const INITIALS_COLORS = ['#fbcfe8', '#fca5a5', '#a5b4fc', '#86efac', '#fcd34d', '#a5f3fc'];

  let myLocationOnly = $state(false);
  let myLocationId = $derived($page.data.profile?.location_id ?? null);
  let searchOpen = $state(false);
  let searchQuery = $state('');
  let locationFilter = $state('');
  let roleFilter = $state('');

  type Employee = {
    id: string;
    name: string;
    location: string;
    location_id: string | null;
    role: string;
    avatar: string | null;
    initials: string;
    bgColor: string;
  };

  let employees = $derived(
    (data.people ?? [])
      .map((p: any, i: number): Employee => ({
        id: p.id,
        name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Team member',
        location: p.location?.name ?? '—',
        location_id: p.location_id ?? null,
        role: p.position || p.job_role?.name || (p.role ?? '').replaceAll('_', ' '),
        avatar: p.avatar_url ?? null,
        initials: `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase() || '?',
        bgColor: INITIALS_COLORS[i % INITIALS_COLORS.length]
      }))
      .filter((e: Employee) => !myLocationOnly || !myLocationId || e.location_id === myLocationId)
      .filter((e: Employee) => !locationFilter || e.location === locationFilter)
      .filter((e: Employee) => !roleFilter || e.role === roleFilter)
      .filter((e: Employee) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          e.name.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q)
        );
      })
  );

  // dropdown options from the full (unfiltered) list
  let allLocations = $derived(
    [...new Set((data.people ?? []).map((p: any) => p.location?.name).filter(Boolean))].sort() as string[]
  );
  let allRoles = $derived(
    [...new Set(
      (data.people ?? [])
        .map((p: any) => p.position || p.job_role?.name || (p.role ?? '').replaceAll('_', ' '))
        .filter(Boolean)
    )].sort() as string[]
  );

  let directoryData = $derived.by(() => {
    const groups = new Map<string, Employee[]>();
    for (const e of employees) {
      const letter = (e.name[0] ?? '#').toUpperCase();
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter)!.push(e);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, emps]) => ({ letter, employees: emps }));
  });
</script>

<div class="page-container">
  <!-- Header -->
  <header class="top-header">
    <button class="icon-btn" onclick={() => goto('/')}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e66420" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <h1 class="title">People Directory ({employees.length})</h1>
    <button
      class="icon-btn"
      aria-label="Search people"
      onclick={() => {
        searchOpen = !searchOpen;
        if (!searchOpen) searchQuery = '';
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e66420" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </button>
  </header>

  {#if searchOpen}
    <div class="search-bar">
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="search"
        placeholder="Search by name, role or location…"
        bind:value={searchQuery}
        autofocus
      />
    </div>
  {/if}

  <!-- Filter Pills -->
  <div class="filter-section hide-scrollbar">
    <button class="filter-pill" class:active={myLocationOnly} onclick={() => (myLocationOnly = !myLocationOnly)}>✨ My location</button>
    <label class="filter-pill dropdown" class:active={!!locationFilter}>
      <select bind:value={locationFilter} aria-label="Filter by location">
        <option value="">Locations</option>
        {#each allLocations as loc}
          <option value={loc}>{loc}</option>
        {/each}
      </select>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
    </label>
    <label class="filter-pill dropdown" class:active={!!roleFilter}>
      <select bind:value={roleFilter} aria-label="Filter by role">
        <option value="">Roles</option>
        {#each allRoles as role}
          <option value={role}>{role}</option>
        {/each}
      </select>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
    </label>
  </div>

  <!-- Directory List -->
  <div class="directory-list scrollable-content hide-scrollbar">
    {#each directoryData as group}
      <div class="group-section">
        <h2 class="letter-header">{group.letter}</h2>
        <div class="employees">
          {#each group.employees as emp}
            <a href={`/directory/${emp.id}`} class="employee-item" style="text-decoration: none; color: inherit;">
              
              <!-- Avatar Area -->
              <div class="avatar-wrapper">
                {#if emp.avatar}
                  <img src={emp.avatar} alt={emp.name} class="avatar-img" />
                {:else}
                  <div class="avatar-initials" style={`background-color: ${emp.bgColor || '#fca5a5'}`}>
                    {emp.initials}
                  </div>
                {/if}
              </div>

              <!-- Info Area -->
              <div class="employee-info">
                <h3 class="name">{emp.name}</h3>
                <div class="meta">
                  <span class="icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg></span>
                  {emp.location}
                </div>
                <div class="meta">
                  <span class="icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span>
                  {emp.role}
                </div>
              </div>

            </a>
          {/each}
        </div>
      </div>
    {/each}
    <div class="bottom-spacer"></div>
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

  /* Header */
  .top-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1rem;
    background: white;
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
  }

  .title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text, #111);
    margin: 0;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  /* Filters */
  .filter-section {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    overflow-x: auto;
    white-space: nowrap;
    border-bottom: 1px solid #f9f9f9;
    flex-shrink: 0;
  }

  .filter-pill {
    background: #f8f9fa;
    border: 1px solid #eee;
    color: var(--color-text-muted, #555);
    padding: 0.5rem 0.85rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .filter-pill.active {
    background: #fffdf5; /* Subtle yellow */
    border-color: #e66420;
    color: #e66420;
  }

  .filter-pill.dropdown svg {
    margin-left: 2px;
  }

  .filter-pill.dropdown {
    position: relative;
    padding-right: 0.7rem;
  }

  .filter-pill.dropdown select {
    appearance: none;
    -webkit-appearance: none;
    background: transparent;
    border: none;
    font: inherit;
    color: inherit;
    cursor: pointer;
    outline: none;
    max-width: 130px;
    text-overflow: ellipsis;
  }

  /* Search bar */
  .search-bar {
    padding: 0.75rem 1.25rem 0;
    flex-shrink: 0;
  }

  .search-bar input {
    width: 100%;
    border: 1px solid #eee;
    background: #f8f9fa;
    border-radius: 12px;
    padding: 0.6rem 0.9rem;
    font-size: 0.9rem;
    font-family: inherit;
    outline: none;
  }

  .search-bar input:focus {
    border-color: #e66420;
    background: white;
  }

  /* Directory List */
  .directory-list {
    padding: 0 1.25rem;
  }

  .group-section {
    margin-bottom: 1.5rem;
  }

  .letter-header {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text, #111);
    margin: 1rem 0 0.5rem 0;
  }

  .employees {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .employee-item {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .avatar-wrapper {
    position: relative;
    width: 64px;
    height: 64px;
    flex-shrink: 0;
  }

  .avatar-img, .avatar-initials {
    width: 100%;
    height: 100%;
    border-radius: 16px; /* Squircle appearance */
    object-fit: cover;
  }

  .avatar-initials {
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 1.2rem;
  }

  .avatar-badge {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    color: #111;
    font-size: 0.6rem;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    white-space: nowrap;
    border: 1px solid #eee;
  }

  .employee-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .name {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--color-text, #111);
    margin: 0 0 0.25rem 0;
  }

  .meta {
    font-size: 0.75rem;
    color: var(--color-text-muted, #777);
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .icon {
    display: flex;
    align-items: center;
    opacity: 0.6;
  }

  .bottom-spacer {
    height: 40px;
  }
</style>

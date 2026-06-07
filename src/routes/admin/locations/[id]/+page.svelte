<script lang="ts">
  import { enhance } from '$app/forms';
  import { fullName } from '$lib/types';
  let { data, form } = $props();

  // top-level navigation
  let tab = $state<'overview' | 'hours' | 'team' | 'setup'>('overview');

  // overview
  let editingLocation = $state(false);

  // accordion open-state, one item per section at a time
  let openDept = $state<string | null>(null);
  let openResp = $state<string | null>(null);
  let openRole = $state<string | null>(null);

  // add-new collapsed rows
  let addDept = $state(false);
  let addResp = $state(false);
  let addRole = $state(false);

  const priorities = ['low', 'medium', 'high', 'critical'];
  const days = [
    { key: '1', label: 'Mon' },
    { key: '2', label: 'Tue' },
    { key: '3', label: 'Wed' },
    { key: '4', label: 'Thu' },
    { key: '5', label: 'Fri' },
    { key: '6', label: 'Sat' },
    { key: '7', label: 'Sun' }
  ];

  const statusBadge: Record<string, string> = {
    active: 'green',
    inactive: 'yellow',
    on_leave: 'yellow',
    suspended: 'red'
  };

  const loc = $derived(data.location);
  const addrLine = $derived(
    [loc.address, loc.postal_code, loc.city, loc.country].filter(Boolean).join(', ')
  );
  const hours = $derived(
    (loc.opening_hours ?? {}) as Record<string, { open: string; close: string } | null>
  );
  const openDayCount = $derived(days.filter((d) => hours[d.key]).length);

  const headLine = $derived(
    [
      addrLine || null,
      loc.phone || null,
      `Open ${openDayCount} of 7 days`,
      `${data.staff.length} staff`
    ]
      .filter(Boolean)
      .join(' · ')
  );

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'hours', label: 'Opening hours' },
    { key: 'team', label: 'Team' },
    { key: 'setup', label: 'Roles & setup' }
  ] as const;
</script>

<!-- ===================== Compact header ===================== -->
<div class="loc-header">
  <a class="muted back" href="/admin/locations" style="text-decoration:none;">← All locations</a>
  <div class="row-flex" style="gap:0.55rem;flex-wrap:wrap;margin-top:0.35rem;">
    <h1 class="loc-name">{loc.name}</h1>
    {#if loc.brand?.name}<span class="badge gray">{loc.brand.name}</span>{/if}
    <span class="badge {loc.chat_enabled ? 'green' : 'gray'}">chat {loc.chat_enabled ? 'on' : 'off'}</span>
  </div>
  <p class="muted" style="margin-top:0.3rem;">{headLine}</p>
</div>

{#if form?.message}<div class="alert error">{form.message}</div>{/if}

<!-- ===================== Tab bar ===================== -->
<div class="tabbar" role="tablist">
  {#each tabs as t}
    <button
      type="button"
      role="tab"
      class="tab"
      class:active={tab === t.key}
      aria-selected={tab === t.key}
      onclick={() => (tab = t.key)}
    >
      {t.label}
    </button>
  {/each}
</div>

<!-- ===================== Overview ===================== -->
{#if tab === 'overview'}
  <div class="card">
    {#if !editingLocation}
      <div class="row-flex" style="justify-content:space-between;align-items:flex-start;">
        <h2 style="margin:0;">Location details</h2>
        <button class="btn sm" onclick={() => (editingLocation = true)}>Edit details</button>
      </div>
      <dl class="kv">
        <div><dt>Brand</dt><dd>{loc.brand?.name ?? '—'}</dd></div>
        <div><dt>Address</dt><dd>{addrLine || '—'}</dd></div>
        <div><dt>Phone</dt><dd>{loc.phone || '—'}</dd></div>
        <div><dt>Email</dt><dd>{loc.email || '—'}</dd></div>
      </dl>
    {:else}
      <h2>Edit details</h2>
      <form
        method="POST"
        action="?/updateLocation"
        use:enhance={() =>
          async ({ update }) => {
            editingLocation = false;
            await update();
          }}
      >
        <div class="form-grid">
          <label class="field"><span>Name *</span><input type="text" name="name" value={loc.name} required /></label>
          <label class="field">
            <span>Brand</span>
            <select name="brand_id">
              <option value="">— none —</option>
              {#each data.brands as b}<option value={b.id} selected={b.id === loc.brand_id}>{b.name}</option>{/each}
            </select>
          </label>
          <label class="field"><span>Address</span><input type="text" name="address" value={loc.address ?? ''} /></label>
          <label class="field"><span>City</span><input type="text" name="city" value={loc.city ?? ''} /></label>
          <label class="field"><span>Postal code</span><input type="text" name="postal_code" value={loc.postal_code ?? ''} /></label>
          <label class="field"><span>Country</span><input type="text" name="country" value={loc.country ?? ''} /></label>
          <label class="field"><span>Phone</span><input type="text" name="phone" value={loc.phone ?? ''} /></label>
          <label class="field"><span>Email</span><input type="email" name="email" value={loc.email ?? ''} /></label>
        </div>
        <div class="form-actions">
          <button class="btn primary" type="submit">Save changes</button>
          <button class="btn" type="button" onclick={() => (editingLocation = false)}>Cancel</button>
        </div>
      </form>
    {/if}
  </div>

  <div class="card">
    <h2>Customer chat</h2>
    <div class="row-flex" style="justify-content:space-between;gap:1rem;align-items:flex-start;">
      <p class="muted" style="max-width:560px;">
        When enabled, this restaurant appears in the customer chat experience. Turn it off to hide
        the location while keeping all its setup intact.
      </p>
      <form method="POST" action="?/toggleChat" use:enhance>
        <input type="hidden" name="enable" value={(!loc.chat_enabled).toString()} />
        <button class="btn" type="submit">{loc.chat_enabled ? 'Disable chat' : 'Enable chat'}</button>
      </form>
    </div>
  </div>

  <div class="card danger-zone">
    <h2>Danger zone</h2>
    <div class="row-flex" style="justify-content:space-between;gap:1rem;align-items:flex-start;">
      <p class="muted" style="max-width:560px;">
        Deleting this location is permanent and removes it from every schedule and report.
      </p>
      <form
        method="POST"
        action="?/deleteLocation"
        use:enhance
        onsubmit={(e) => {
          if (!confirm(`Delete ${loc.name}? This cannot be undone.`)) e.preventDefault();
        }}
      >
        <button class="btn danger" type="submit">Delete location</button>
      </form>
    </div>
  </div>
{/if}

<!-- ===================== Opening hours ===================== -->
{#if tab === 'hours'}
  <div class="card">
    <h2>Opening hours</h2>
    <p class="muted" style="margin-bottom:0.9rem;">Tick a day to open it, then set the hours.</p>
    <form method="POST" action="?/updateHours" use:enhance>
      <div class="hours-edit">
        {#each days as d}
          {@const cur = hours[d.key]}
          <div class="hours-edit-row">
            <label class="day-check">
              <input
                type="checkbox"
                name="open_{d.key}"
                checked={!!cur}
                onchange={(e) => {
                  const row = (e.currentTarget as HTMLInputElement).closest('.hours-edit-row');
                  const ins = row?.querySelectorAll('input[type=time]') ?? [];
                  ins.forEach((i: any) => (i.disabled = !(e.currentTarget as HTMLInputElement).checked));
                }}
              />
              <span>{d.label}</span>
            </label>
            <input type="time" name="from_{d.key}" value={cur?.open ?? '09:00'} disabled={!cur} />
            <span class="muted">–</span>
            <input type="time" name="to_{d.key}" value={cur?.close ?? '17:00'} disabled={!cur} />
          </div>
        {/each}
      </div>
      <div class="form-actions">
        <button class="btn primary" type="submit">Save hours</button>
      </div>
    </form>
  </div>
{/if}

<!-- ===================== Team ===================== -->
{#if tab === 'team'}
  <div class="card">
    <h2>Team ({data.staff.length})</h2>

    {#if data.staff.length}
      <div class="people">
        {#each data.staff as p}
          <div class="person">
            <div class="avatar-sm">
              {#if p.avatar_url}<img src={p.avatar_url} alt="" />{:else}{(p.first_name?.[0] ?? '') + (p.last_name?.[0] ?? '')}{/if}
            </div>
            <div style="min-width:0;">
              <a href="/admin/users?location={loc.id}" class="font-semibold" style="text-decoration:none;color:inherit;">{fullName(p)}</a>
              <div class="muted">{[p.position || p.job_role?.name, p.department?.name].filter(Boolean).join(' · ') || '—'}</div>
            </div>
            <div class="row-flex" style="gap:0.4rem;margin-left:auto;">
              {#if p.contract_type === 'hourly'}
                <span class="badge blue">Hourly{p.hourly_rate != null ? ` · ${p.hourly_rate} kr/h` : ''}</span>
              {:else}
                <span class="badge gray">Full-time</span>
              {/if}
              <span class="badge {statusBadge[p.status] ?? 'gray'}">{p.status.replace('_', ' ')}</span>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty">No staff assigned to this restaurant yet.</div>
    {/if}

    <div class="addrow">
      <form method="POST" action="?/addStaff" use:enhance class="row-flex" style="gap:0.5rem;flex:1;">
        <select name="user_id" required style="flex:1;">
          <option value="">Add existing user to this restaurant…</option>
          {#each data.addableUsers as u}<option value={u.id}>{fullName(u)}</option>{/each}
        </select>
        <button class="btn sm primary" type="submit">Add</button>
      </form>
      <a class="btn sm" href="/admin/users">+ Create new user</a>
    </div>
  </div>
{/if}

<!-- ===================== Roles & setup ===================== -->
{#if tab === 'setup'}
  <!-- 1 · Departments -->
  <div class="card">
    <h2>1 · Departments</h2>
    <p class="muted" style="margin-bottom:0.8rem;">
      Broad areas of the restaurant (kitchen, front of house…). Shared across all restaurants.
    </p>
    <div class="acc">
      {#each data.departments as d}
        {@const isOpen = openDept === d.id}
        <div class="acc-item">
          <button type="button" class="acc-row" class:open={isOpen} onclick={() => (openDept = isOpen ? null : d.id)}>
            <span class="chev">▸</span>
            <span class="acc-title">{d.name}</span>
            <span class="muted acc-meta">{d.staff?.[0]?.count ?? 0} staff</span>
          </button>
          {#if isOpen}
            <div class="acc-panel">
              <form
                method="POST"
                action="?/updateDepartment"
                use:enhance={() =>
                  async ({ update }) => {
                    openDept = null;
                    await update();
                  }}
              >
                <input type="hidden" name="id" value={d.id} />
                <label class="field"><span>Name *</span><input type="text" name="name" value={d.name} required /></label>
                <div class="form-actions">
                  <button class="btn sm primary" type="submit">Save</button>
                </div>
              </form>
              <form
                method="POST"
                action="?/deleteDepartment"
                use:enhance
                onsubmit={(e) => {
                  if (!confirm(`Delete department “${d.name}”?`)) e.preventDefault();
                }}
                style="margin-top:0.5rem;"
              >
                <input type="hidden" name="id" value={d.id} />
                <button class="btn sm danger" type="submit">Delete department</button>
              </form>
            </div>
          {/if}
        </div>
      {:else}
        <div class="empty">No departments yet.</div>
      {/each}

      <div class="acc-item">
        {#if !addDept}
          <button type="button" class="acc-row add" onclick={() => (addDept = true)}>
            <span class="chev plus">+</span>
            <span class="acc-title">Add department</span>
          </button>
        {:else}
          <div class="acc-panel">
            <form
              method="POST"
              action="?/createDepartment"
              use:enhance={() =>
                async ({ update }) => {
                  addDept = false;
                  await update();
                }}
            >
              <label class="field"><span>Name *</span><input type="text" name="name" placeholder="e.g. Kitchen" required /></label>
              <div class="form-actions">
                <button class="btn sm primary" type="submit">Add department</button>
                <button class="btn sm" type="button" onclick={() => (addDept = false)}>Cancel</button>
              </div>
            </form>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- 2 · Responsibilities -->
  <div class="card">
    <h2>2 · Responsibilities</h2>
    <p class="muted" style="margin-bottom:0.8rem;">
      Individual tasks or duties. These get bundled into job roles in the next step.
    </p>
    <div class="acc">
      {#each data.responsibilities as r}
        {@const isOpen = openResp === r.id}
        <div class="acc-item">
          <button type="button" class="acc-row" class:open={isOpen} onclick={() => (openResp = isOpen ? null : r.id)}>
            <span class="chev">▸</span>
            <span class="acc-title">{r.name}</span>
            <span class="badge {r.location_id ? 'orange' : 'gray'}">{r.location_id ? loc.name : 'Universal'}</span>
            <span class="badge gray acc-meta">{r.priority}</span>
          </button>
          {#if isOpen}
            <div class="acc-panel">
              <form
                method="POST"
                action="?/updateResponsibility"
                use:enhance={() =>
                  async ({ update }) => {
                    openResp = null;
                    await update();
                  }}
              >
                <input type="hidden" name="id" value={r.id} />
                <div class="stack">
                  <label class="field"><span>Name *</span><input type="text" name="name" value={r.name} required /></label>
                  <label class="field"><span>Description</span><input type="text" name="description" value={r.description ?? ''} /></label>
                  <label class="field">
                    <span>Department</span>
                    <select name="department_id">
                      <option value="">— no department —</option>
                      {#each data.departments as d}<option value={d.id} selected={d.id === r.department_id}>{d.name}</option>{/each}
                    </select>
                  </label>
                  <label class="field"><span>Estimated minutes</span><input type="number" name="estimated_minutes" value={r.estimated_minutes ?? ''} min="0" /></label>
                  <label class="field">
                    <span>Priority</span>
                    <select name="priority">
                      {#each priorities as pr}<option value={pr} selected={pr === r.priority}>{pr}</option>{/each}
                    </select>
                  </label>
                  <label class="field">
                    <span>Scope</span>
                    <select name="scope">
                      <option value="" selected={!r.location_id}>Universal (all restaurants)</option>
                      <option value={loc.id} selected={r.location_id === loc.id}>Only {loc.name}</option>
                    </select>
                  </label>
                </div>
                <div class="form-actions">
                  <button class="btn sm primary" type="submit">Save</button>
                </div>
              </form>
              <form
                method="POST"
                action="?/deleteResponsibility"
                use:enhance
                onsubmit={(e) => {
                  if (!confirm(`Delete responsibility “${r.name}”?`)) e.preventDefault();
                }}
                style="margin-top:0.5rem;"
              >
                <input type="hidden" name="id" value={r.id} />
                <button class="btn sm danger" type="submit">Delete responsibility</button>
              </form>
            </div>
          {/if}
        </div>
      {:else}
        <div class="empty">No responsibilities yet.</div>
      {/each}

      <div class="acc-item">
        {#if !addResp}
          <button type="button" class="acc-row add" onclick={() => (addResp = true)}>
            <span class="chev plus">+</span>
            <span class="acc-title">Add responsibility</span>
          </button>
        {:else}
          <div class="acc-panel">
            <form
              method="POST"
              action="?/createResponsibility"
              use:enhance={() =>
                async ({ update }) => {
                  addResp = false;
                  await update();
                }}
            >
              <div class="stack">
                <label class="field"><span>Name *</span><input type="text" name="name" placeholder="e.g. Clean the grill" required /></label>
                <label class="field"><span>Description</span><input type="text" name="description" /></label>
                <label class="field">
                  <span>Department</span>
                  <select name="department_id">
                    <option value="">— no department —</option>
                    {#each data.departments as d}<option value={d.id}>{d.name}</option>{/each}
                  </select>
                </label>
                <label class="field"><span>Estimated minutes</span><input type="number" name="estimated_minutes" min="0" /></label>
                <label class="field">
                  <span>Priority</span>
                  <select name="priority">
                    {#each priorities as pr}<option value={pr} selected={pr === 'medium'}>{pr}</option>{/each}
                  </select>
                </label>
                <label class="field">
                  <span>Scope</span>
                  <select name="scope">
                    <option value="">Universal (all restaurants)</option>
                    <option value={loc.id}>Only {loc.name}</option>
                  </select>
                </label>
              </div>
              <div class="form-actions">
                <button class="btn sm primary" type="submit">Add responsibility</button>
                <button class="btn sm" type="button" onclick={() => (addResp = false)}>Cancel</button>
              </div>
            </form>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- 3 · Job roles -->
  <div class="card">
    <h2>3 · Job roles</h2>
    <p class="muted" style="margin-bottom:0.8rem;">
      A job role bundles the responsibilities a person in that role is expected to cover.
    </p>
    <div class="acc">
      {#each data.jobRoles as j}
        {@const isOpen = openRole === j.id}
        {@const linkedIds = new Set((j.responsibilities ?? []).map((r: any) => r.id))}
        <div class="acc-item">
          <button type="button" class="acc-row" class:open={isOpen} onclick={() => (openRole = isOpen ? null : j.id)}>
            <span class="chev">▸</span>
            <span class="acc-title">{j.name}</span>
            <span class="badge {j.location_id ? 'orange' : 'gray'}">{j.location_id ? loc.name : 'Universal'}</span>
            {#if j.responsibilities?.length}
              <span class="chips acc-meta">
                {#each j.responsibilities.slice(0, 3) as r}<span class="chip">{r.name}</span>{/each}
                {#if j.responsibilities.length > 3}<span class="chip">+{j.responsibilities.length - 3}</span>{/if}
              </span>
            {/if}
          </button>
          {#if isOpen}
            <div class="acc-panel">
              <form
                method="POST"
                action="?/updateJobRole"
                use:enhance={() =>
                  async ({ update }) => {
                    openRole = null;
                    await update();
                  }}
              >
                <input type="hidden" name="id" value={j.id} />
                <div class="stack">
                  <label class="field"><span>Name *</span><input type="text" name="name" value={j.name} required /></label>
                  <label class="field"><span>Description</span><input type="text" name="description" value={j.description ?? ''} /></label>
                  <div class="field">
                    <span>Responsibilities</span>
                    <div class="check-list">
                      {#each data.responsibilities as r}
                        <label class="check-item">
                          <input type="checkbox" name="responsibility_id" value={r.id} checked={linkedIds.has(r.id)} />
                          <span>{r.name}</span>
                        </label>
                      {:else}
                        <span class="muted">No responsibilities defined yet.</span>
                      {/each}
                    </div>
                  </div>
                </div>
                <div class="form-actions">
                  <button class="btn sm primary" type="submit">Save</button>
                </div>
              </form>
              <form
                method="POST"
                action="?/deleteJobRole"
                use:enhance
                onsubmit={(e) => {
                  if (!confirm(`Delete job role “${j.name}”?`)) e.preventDefault();
                }}
                style="margin-top:0.5rem;"
              >
                <input type="hidden" name="id" value={j.id} />
                <button class="btn sm danger" type="submit">Delete job role</button>
              </form>
            </div>
          {/if}
        </div>
      {:else}
        <div class="empty">No job roles yet.</div>
      {/each}

      <div class="acc-item">
        {#if !addRole}
          <button type="button" class="acc-row add" onclick={() => (addRole = true)}>
            <span class="chev plus">+</span>
            <span class="acc-title">Add job role</span>
          </button>
        {:else}
          <div class="acc-panel">
            <form
              method="POST"
              action="?/createJobRole"
              use:enhance={() =>
                async ({ update }) => {
                  addRole = false;
                  await update();
                }}
            >
              <div class="stack">
                <label class="field"><span>Name *</span><input type="text" name="name" placeholder="e.g. Line cook" required /></label>
                <label class="field"><span>Description</span><input type="text" name="description" /></label>
                <label class="field">
                  <span>Scope</span>
                  <select name="scope">
                    <option value="">Universal (all restaurants)</option>
                    <option value={loc.id}>Only {loc.name}</option>
                  </select>
                </label>
                <p class="muted" style="margin:0;">Save the role first, then reopen it to attach responsibilities.</p>
              </div>
              <div class="form-actions">
                <button class="btn sm primary" type="submit">Add job role</button>
                <button class="btn sm" type="button" onclick={() => (addRole = false)}>Cancel</button>
              </div>
            </form>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- 4 · Required on the schedule -->
  <div class="card">
    <h2>4 · Required on the schedule</h2>
    <p class="muted" style="margin-bottom:0.9rem;">
      Pick which of the roles above this restaurant must staff every day. These become the rows of
      the shift planner and drive the "missing role" warnings on the schedule.
    </p>
    <form method="POST" action="?/updateRequiredRoles" use:enhance>
      <div class="req-roles">
        {#each data.jobRoles as j}
          <label class="req-role" class:on={data.requiredRoleIds.includes(j.id)}>
            <input type="checkbox" name="required_role_ids" value={j.id} checked={data.requiredRoleIds.includes(j.id)} />
            <span>{j.name}</span>
          </label>
        {:else}
          <span class="muted">No job roles defined yet — add some in step 3.</span>
        {/each}
      </div>
      <div class="form-actions">
        <button class="btn primary" type="submit">Save required roles</button>
        {#if data.requiredRoleIds.length === 0}
          <span class="muted">None selected — the planner falls back to your team's job roles.</span>
        {/if}
      </div>
    </form>
  </div>
{/if}

<style>
  /* ---- Header ---- */
  .loc-header { margin-bottom: 0.25rem; }
  .loc-header .back { font-size: 0.78rem; }
  .loc-name { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.4px; margin: 0; }
  .loc-header p { font-size: 0.82rem; }

  /* ---- Tab bar ---- */
  .tabbar {
    display: flex;
    gap: 0.25rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 0.25rem;
  }
  .tab {
    appearance: none;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 0.5rem 0.75rem;
    margin-bottom: -1px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--muted);
    cursor: pointer;
  }
  .tab:hover { color: var(--text); }
  .tab.active { color: var(--lime-dark); border-bottom-color: var(--lime-h); }

  /* ---- Overview ---- */
  .kv {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.7rem;
    margin-top: 0.9rem;
  }
  .kv dt { font-size: 0.72rem; font-weight: 600; color: var(--muted); }
  .kv dd { margin: 0.15rem 0 0; font-size: 0.86rem; }
  .danger-zone { box-shadow: inset 0 0 0 1px #f3caca, var(--card-shadow); }

  /* ---- Required roles picker ---- */
  .req-roles { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .req-role {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.35rem 0.8rem;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    background: var(--surface);
    transition: border-color 0.12s, background 0.12s;
  }
  .req-role.on { background: var(--lime-soft); border-color: var(--lime-h); color: var(--lime-dark); }
  .req-role input { accent-color: var(--lime-dark); }

  /* ---- Team ---- */
  .people { display: flex; flex-direction: column; gap: 0.5rem; }
  .person {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.6rem;
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
  }
  .person .muted { font-size: 0.78rem; }
  .addrow {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.9rem;
    padding-top: 0.9rem;
    border-top: 1px solid var(--border-2);
  }

  /* ---- Opening hours ---- */
  .hours-edit { display: flex; flex-direction: column; gap: 0.45rem; max-width: 360px; }
  .hours-edit-row { display: flex; align-items: center; gap: 0.5rem; }
  .hours-edit-row .day-check { display: flex; align-items: center; gap: 0.35rem; width: 72px; font-size: 0.84rem; }
  .hours-edit-row input[type='time'] { font-size: 0.82rem; }

  /* ---- Accordion ---- */
  .acc { display: flex; flex-direction: column; }
  .acc-item { border-bottom: 1px solid var(--border-2); }
  .acc-item:last-child { border-bottom: none; }
  .acc-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.9rem 0.5rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    font-size: 0.86rem;
    color: var(--text);
  }
  .acc-row:hover { background: var(--surface-2); }
  .acc-row .chev {
    color: var(--muted);
    font-size: 0.8rem;
    transition: transform 0.12s;
    display: inline-block;
    width: 0.9rem;
  }
  .acc-row.open .chev { transform: rotate(90deg); }
  .acc-row .chev.plus { transform: none; font-weight: 700; color: var(--lime-dark); }
  .acc-row.add { color: var(--lime-dark); font-weight: 600; }
  .acc-title { font-weight: 600; }
  .acc-meta { margin-left: auto; }
  .acc-panel {
    background: var(--surface-2);
    border-radius: var(--radius);
    padding: 0.9rem;
    margin: 0 0.25rem 0.6rem;
  }
  .acc-panel .stack { display: flex; flex-direction: column; gap: 0.7rem; max-width: 560px; }
  .acc-panel .field { max-width: 560px; }

  .chips { display: flex; flex-wrap: wrap; gap: 0.25rem; }
  .chip {
    font-size: 0.68rem;
    padding: 0.1rem 0.4rem;
    border-radius: var(--radius-sm);
    background: var(--surface);
    box-shadow: inset 0 0 0 1px var(--border);
    color: var(--text-2);
  }

  .check-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    max-height: 200px;
    overflow-y: auto;
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
  }
  .check-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; font-weight: 400; }

  .font-semibold { font-weight: 600; }
</style>

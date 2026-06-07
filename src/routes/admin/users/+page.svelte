<script lang="ts">
  import { enhance } from '$app/forms';
  import { fullName } from '$lib/types';
  let { data, form } = $props();
  let editing = $state<string | null>(null);

  const roles = [
    ['employee', 'Employee'],
    ['shift_manager', 'Shift Manager'],
    ['restaurant_manager', 'Restaurant Manager'],
    ['org_admin', 'Organization Admin'],
    ['super_admin', 'Super Admin']
  ];
  const statuses = ['active', 'inactive', 'on_leave', 'suspended'];

  const payGroups = [
    ['grupp1', 'Grupp 1 – kvalificerat yrkesarbete'],
    ['grupp2', 'Grupp 2 – yrkesarbete'],
    ['grupp3', 'Grupp 3 – ej fyllda 20 år']
  ];
  const employmentForms = [
    ['provanstallning', 'Provanställning'],
    ['tillsvidare', 'Tillsvidareanställning'],
    ['visstid', 'Allmän visstidsanställning'],
    ['vikariat', 'Vikariat'],
    ['sasong', 'Säsongsarbete'],
    ['enstaka', 'Enstaka dagar']
  ];

  const roleBadge: Record<string, string> = {
    super_admin: 'red',
    org_admin: 'purple',
    restaurant_manager: 'orange',
    shift_manager: 'blue',
    employee: 'gray'
  };
</script>

<div class="page-head">
  <div>
    <h1>Users</h1>
    <p>Create employees and assign them to a restaurant — the assigned restaurant's name is the brand they see in their app.</p>
  </div>
</div>

{#if form?.message}<div class="alert error">{form.message}</div>{/if}
{#if form?.created}<div class="alert success">User created. They can sign in with the email and password you set.</div>{/if}

<details class="create-panel">
  <summary>+ Add user</summary>
  <div class="panel-body">
    <form method="POST" action="?/create" use:enhance>
      <div class="form-grid">
        <label class="field"><span>First name *</span><input type="text" name="first_name" required /></label>
        <label class="field"><span>Last name</span><input type="text" name="last_name" /></label>
        <label class="field"><span>Email *</span><input type="email" name="email" required /></label>
        <label class="field"><span>Password *</span><input type="password" name="password" required minlength="8" placeholder="min. 8 characters" /></label>
        <label class="field">
          <span>System role *</span>
          <select name="role">
            {#each roles as [value, label]}<option {value}>{label}</option>{/each}
          </select>
        </label>
        <label class="field">
          <span>Restaurant (location)</span>
          <select name="location_id">
            <option value="">— unassigned —</option>
            {#each data.locations as l}<option value={l.id}>{l.name}</option>{/each}
          </select>
        </label>
        <label class="field">
          <span>Department</span>
          <select name="department_id">
            <option value="">— none —</option>
            {#each data.departments as d}<option value={d.id}>{d.name}</option>{/each}
          </select>
        </label>
        <label class="field">
          <span>Job role</span>
          <select name="job_role_id">
            <option value="">— none —</option>
            {#each data.jobRoles as j}<option value={j.id}>{j.name}</option>{/each}
          </select>
        </label>
        <label class="field">
          <span>Contract</span>
          <select name="contract_type">
            <option value="full_time">Full-time</option>
            <option value="hourly">Hourly</option>
          </select>
        </label>
        <label class="field"><span>Hourly rate</span><input type="number" name="hourly_rate" step="0.01" placeholder="e.g. 180" /></label>
        <label class="field"><span>Monthly hours (full-time)</span><input type="number" name="monthly_hours" step="1" placeholder="e.g. 160" /></label>
        <label class="field"><span>Position title</span><input type="text" name="position" placeholder="e.g. Kitchen Staff" /></label>
        <label class="field"><span>Employee ID</span><input type="text" name="employee_id" /></label>
        <label class="field"><span>Phone</span><input type="text" name="phone" /></label>
        <label class="field"><span>Personal number</span><input type="text" name="personal_number" /></label>
        <label class="field"><span>Date of birth</span><input type="date" name="date_of_birth" /></label>
        <label class="field"><span>Hire date</span><input type="date" name="hire_date" /></label>
        <label class="field"><span>Address</span><input type="text" name="address" /></label>
        <label class="field"><span>Postal code</span><input type="text" name="postal_code" /></label>
        <label class="field"><span>City</span><input type="text" name="city" /></label>
        <label class="field">
          <span>Pay group (paygrade)</span>
          <select name="pay_group">
            <option value="">—</option>
            {#each payGroups as [value, label]}<option {value}>{label}</option>{/each}
          </select>
        </label>
        <label class="field"><span>Monthly salary (SEK)</span><input type="number" name="monthly_salary" step="1" /></label>
        <label class="field">
          <span>Employment form</span>
          <select name="employment_form">
            <option value="">—</option>
            {#each employmentForms as [value, label]}<option {value}>{label}</option>{/each}
          </select>
        </label>
        <label class="field"><span>Employment end</span><input type="date" name="employment_end" /></label>
        <label class="field"><span>Occupation code</span><input type="text" name="occupation_code" placeholder="e.g. 3451" /></label>
        <label class="field"><span>Bank account</span><input type="text" name="bank_account" /></label>
      </div>
      <div class="form-actions">
        <button class="btn primary" type="submit">Create user</button>
      </div>
    </form>
  </div>
</details>

<div class="card">
  <form method="GET" class="filters" style="margin-bottom: 0.9rem;">
    <input type="text" name="q" placeholder="Search name or email…" value={data.filters.q} />
    <select name="location">
      <option value="">All locations</option>
      {#each data.locations as l}<option value={l.id} selected={l.id === data.filters.locationId}>{l.name}</option>{/each}
    </select>
    <select name="role">
      <option value="">All roles</option>
      {#each roles as [value, label]}<option {value} selected={value === data.filters.role}>{label}</option>{/each}
    </select>
    <button class="btn" type="submit">Filter</button>
  </form>

  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Name</th><th>Email</th><th>Role</th><th>Restaurant</th><th>Department</th><th>Contract</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        {#each data.users as u}
          <tr>
            <td>
              <div class="row-flex">
                <div class="avatar-sm">
                  {#if u.avatar_url}<img src={u.avatar_url} alt="" />{:else}{(u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')}{/if}
                </div>
                <span class="font-semibold">{fullName(u)}</span>
              </div>
            </td>
            <td class="muted">{u.email}</td>
            <td><span class="badge {roleBadge[u.role] ?? 'gray'}">{u.role.replaceAll('_', ' ')}</span></td>
            <td>{u.location?.name ?? '—'}</td>
            <td>{u.department?.name ?? '—'}</td>
            <td>
              {#if u.contract_type === 'hourly'}
                <span class="badge blue">Hourly{u.hourly_rate ? ` · ${u.hourly_rate}/h` : ''}</span>
              {:else}
                <span class="badge gray">Full-time</span>
              {/if}
            </td>
            <td><span class="badge {u.status === 'active' ? 'green' : u.status === 'suspended' ? 'red' : 'yellow'}">{u.status.replace('_', ' ')}</span></td>
            <td>
              <div class="row-flex">
                <button class="btn sm" onclick={() => (editing = editing === u.id ? null : u.id)}>{editing === u.id ? 'Close' : 'Edit'}</button>
                <a class="btn sm" href={`/admin/offer-letter/${u.id}`} target="_blank">📄 Offer letter</a>
                <form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm(`Delete ${fullName(u)}? This removes their account.`)) e.preventDefault(); }}>
                  <input type="hidden" name="id" value={u.id} />
                  <button class="btn sm danger" type="submit">Delete</button>
                </form>
              </div>
            </td>
          </tr>
          {#if editing === u.id}
            <tr>
              <td colspan="8" style="background:#fafafa;">
                <form method="POST" action="?/update" use:enhance={() => async ({ update }) => { editing = null; await update(); }}>
                  <input type="hidden" name="id" value={u.id} />
                  <div class="form-grid">
                    <label class="field"><span>First name</span><input type="text" name="first_name" value={u.first_name} /></label>
                    <label class="field"><span>Last name</span><input type="text" name="last_name" value={u.last_name} /></label>
                    <label class="field">
                      <span>System role</span>
                      <select name="role">
                        {#each roles as [value, label]}<option {value} selected={value === u.role}>{label}</option>{/each}
                      </select>
                    </label>
                    <label class="field">
                      <span>Restaurant (location)</span>
                      <select name="location_id">
                        <option value="">— unassigned —</option>
                        {#each data.locations as l}<option value={l.id} selected={l.id === u.location_id}>{l.name}</option>{/each}
                      </select>
                    </label>
                    <label class="field">
                      <span>Department</span>
                      <select name="department_id">
                        <option value="">— none —</option>
                        {#each data.departments as d}<option value={d.id} selected={d.id === u.department_id}>{d.name}</option>{/each}
                      </select>
                    </label>
                    <label class="field">
                      <span>Job role</span>
                      <select name="job_role_id">
                        <option value="">— none —</option>
                        {#each data.jobRoles as j}<option value={j.id} selected={j.id === u.job_role_id}>{j.name}</option>{/each}
                      </select>
                    </label>
                    <label class="field">
                      <span>Contract</span>
                      <select name="contract_type">
                        <option value="full_time" selected={u.contract_type === 'full_time'}>Full-time</option>
                        <option value="hourly" selected={u.contract_type === 'hourly'}>Hourly</option>
                      </select>
                    </label>
                    <label class="field"><span>Hourly rate</span><input type="number" name="hourly_rate" step="0.01" placeholder="e.g. 180" value={u.hourly_rate ?? ''} /></label>
                    <label class="field"><span>Monthly hours (full-time)</span><input type="number" name="monthly_hours" step="1" placeholder="e.g. 160" value={u.monthly_hours ?? ''} /></label>
                    <label class="field"><span>Position title</span><input type="text" name="position" value={u.position ?? ''} /></label>
                    <label class="field"><span>Employee ID</span><input type="text" name="employee_id" value={u.employee_id ?? ''} /></label>
                    <label class="field"><span>Phone</span><input type="text" name="phone" value={u.phone ?? ''} /></label>
                    <label class="field"><span>Personal number</span><input type="text" name="personal_number" value={u.personal_number ?? ''} /></label>
                    <label class="field"><span>Date of birth</span><input type="date" name="date_of_birth" value={u.date_of_birth ?? ''} /></label>
                    <label class="field"><span>Hire date</span><input type="date" name="hire_date" value={u.hire_date ?? ''} /></label>
                    <label class="field"><span>Address</span><input type="text" name="address" value={u.address ?? ''} /></label>
                    <label class="field"><span>Postal code</span><input type="text" name="postal_code" value={u.postal_code ?? ''} /></label>
                    <label class="field"><span>City</span><input type="text" name="city" value={u.city ?? ''} /></label>
                    <label class="field">
                      <span>Pay group (paygrade)</span>
                      <select name="pay_group">
                        <option value="">—</option>
                        {#each payGroups as [value, label]}<option {value} selected={value === u.pay_group}>{label}</option>{/each}
                      </select>
                    </label>
                    <label class="field"><span>Monthly salary (SEK)</span><input type="number" name="monthly_salary" step="1" value={u.monthly_salary ?? ''} /></label>
                    <label class="field">
                      <span>Employment form</span>
                      <select name="employment_form">
                        <option value="">—</option>
                        {#each employmentForms as [value, label]}<option {value} selected={value === u.employment_form}>{label}</option>{/each}
                      </select>
                    </label>
                    <label class="field"><span>Employment end</span><input type="date" name="employment_end" value={u.employment_end ?? ''} /></label>
                    <label class="field"><span>Occupation code</span><input type="text" name="occupation_code" placeholder="e.g. 3451" value={u.occupation_code ?? ''} /></label>
                    <label class="field"><span>Bank account</span><input type="text" name="bank_account" value={u.bank_account ?? ''} /></label>
                    <label class="field">
                      <span>Status</span>
                      <select name="status">
                        {#each statuses as s}<option value={s} selected={s === u.status}>{s.replace('_', ' ')}</option>{/each}
                      </select>
                    </label>
                  </div>
                  <div class="form-actions">
                    <button class="btn primary" type="submit">Save changes</button>
                  </div>
                </form>
              </td>
            </tr>
          {/if}
        {:else}
          <tr><td colspan="8" class="empty">No users match.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

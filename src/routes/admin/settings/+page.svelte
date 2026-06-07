<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  let editing = $state<string | null>(null);
</script>

<div class="page-head">
  <div>
    <h1>Settings</h1>
    <p>Feature flags and organization configuration.</p>
  </div>
</div>

{#if form?.message}
  <div class="alert error">{form.message}</div>
{/if}

<div class="card">
  <h2>Organization</h2>
  <form method="POST" action="?/updateOrg" use:enhance>
    <div class="form-grid">
      <label class="field">
        <span>Organization name</span>
        <input type="text" name="name" value={data.org?.name ?? ''} required />
      </label>
    </div>
    <div class="form-actions">
      <button class="btn primary" type="submit">Save</button>
      {#if form?.orgUpdated}<span class="badge green">Saved</span>{/if}
    </div>
  </form>
</div>

<div class="card">
  <h2>Company details</h2>
  <p class="muted" style="margin-bottom: 1rem;">
    Legal entities used on employment documents and offer letters. You can register several.
  </p>

  <details class="create-panel" style="margin-bottom: 1rem;">
    <summary>+ Add company</summary>
    <div class="panel-body">
      <form method="POST" action="?/createCompany" use:enhance>
        <div class="form-grid">
          <label class="field"><span>Company name *</span><input type="text" name="name" required /></label>
          <label class="field"><span>Org number</span><input type="text" name="org_number" placeholder="556XXX-XXXX" /></label>
          <label class="field"><span>Address</span><input type="text" name="address" /></label>
          <label class="field"><span>Postal code</span><input type="text" name="postal_code" /></label>
          <label class="field"><span>City</span><input type="text" name="city" /></label>
          <label class="field"><span>Country</span><input type="text" name="country" value="Sweden" /></label>
          <label class="field"><span>Phone</span><input type="text" name="phone" /></label>
          <label class="field"><span>Email</span><input type="email" name="email" /></label>
          <label class="field"><span>Workplace</span><input type="text" name="workplace" placeholder="e.g. Little Asia, Stockholm" /></label>
          <label class="field"><span>Collective agreement</span><input type="text" name="collective_agreement" value="HRF" /></label>
          <label class="field"><span>Signatory name</span><input type="text" name="signatory_name" /></label>
          <label class="field"><span>Signatory title</span><input type="text" name="signatory_title" /></label>
          <label class="field"><span>Payday</span><input type="text" name="payday" placeholder="e.g. 27th" /></label>
        </div>
        <div class="form-actions">
          <button class="btn primary" type="submit">Create company</button>
        </div>
      </form>
    </div>
  </details>

  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Name</th><th>Org number</th><th>City</th><th>Workplace</th><th>Signatory</th><th></th></tr>
      </thead>
      <tbody>
        {#each data.companies as c}
          <tr>
            <td class="font-semibold">{c.name}</td>
            <td>{c.org_number ?? '—'}</td>
            <td>{c.city ?? '—'}</td>
            <td>{c.workplace ?? '—'}</td>
            <td>{c.signatory_name ?? '—'}</td>
            <td>
              <div class="row-flex">
                <button class="btn sm" onclick={() => (editing = editing === c.id ? null : c.id)}>
                  {editing === c.id ? 'Close' : 'Edit'}
                </button>
                <form method="POST" action="?/deleteCompany" use:enhance onsubmit={(e) => { if (!confirm(`Delete ${c.name}?`)) e.preventDefault(); }}>
                  <input type="hidden" name="id" value={c.id} />
                  <button class="btn sm danger" type="submit">Delete</button>
                </form>
              </div>
            </td>
          </tr>
          {#if editing === c.id}
            <tr>
              <td colspan="6" style="background:#fafafa;">
                <form method="POST" action="?/updateCompany" use:enhance={() => async ({ update }) => { editing = null; await update(); }}>
                  <input type="hidden" name="id" value={c.id} />
                  <div class="form-grid">
                    <label class="field"><span>Company name *</span><input type="text" name="name" value={c.name} required /></label>
                    <label class="field"><span>Org number</span><input type="text" name="org_number" value={c.org_number ?? ''} placeholder="556XXX-XXXX" /></label>
                    <label class="field"><span>Address</span><input type="text" name="address" value={c.address ?? ''} /></label>
                    <label class="field"><span>Postal code</span><input type="text" name="postal_code" value={c.postal_code ?? ''} /></label>
                    <label class="field"><span>City</span><input type="text" name="city" value={c.city ?? ''} /></label>
                    <label class="field"><span>Country</span><input type="text" name="country" value={c.country ?? 'Sweden'} /></label>
                    <label class="field"><span>Phone</span><input type="text" name="phone" value={c.phone ?? ''} /></label>
                    <label class="field"><span>Email</span><input type="email" name="email" value={c.email ?? ''} /></label>
                    <label class="field"><span>Workplace</span><input type="text" name="workplace" value={c.workplace ?? ''} placeholder="e.g. Little Asia, Stockholm" /></label>
                    <label class="field"><span>Collective agreement</span><input type="text" name="collective_agreement" value={c.collective_agreement ?? 'HRF'} /></label>
                    <label class="field"><span>Signatory name</span><input type="text" name="signatory_name" value={c.signatory_name ?? ''} /></label>
                    <label class="field"><span>Signatory title</span><input type="text" name="signatory_title" value={c.signatory_title ?? ''} /></label>
                    <label class="field"><span>Payday</span><input type="text" name="payday" value={c.payday ?? ''} placeholder="e.g. 27th" /></label>
                  </div>
                  <div class="form-actions">
                    <button class="btn primary" type="submit">Save changes</button>
                  </div>
                </form>
              </td>
            </tr>
          {/if}
        {:else}
          <tr><td colspan="6" class="empty">No companies yet. Use “+ Add company” above.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<div class="card">
  <h2>Chat feature</h2>
  <p class="muted" style="margin-bottom: 1rem;">
    Chat is currently disabled for employees by default. Enable it per restaurant when you're
    ready — the Chat tab appears in the employee app immediately.
  </p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Restaurant</th><th>Brand</th><th>City</th><th>Chat</th><th></th></tr></thead>
      <tbody>
        {#each data.locations as l}
          <tr>
            <td class="font-semibold">{l.name}</td>
            <td>{l.brand?.name ?? '—'}</td>
            <td>{l.city ?? '—'}</td>
            <td>
              <span class="badge {l.chat_enabled ? 'green' : 'gray'}">
                {l.chat_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </td>
            <td>
              <form method="POST" action="?/toggleChat" use:enhance>
                <input type="hidden" name="location_id" value={l.id} />
                <input type="hidden" name="enabled" value={(!l.chat_enabled).toString()} />
                <button class="btn sm {l.chat_enabled ? 'danger' : 'green'}" type="submit">
                  {l.chat_enabled ? 'Disable chat' : 'Enable chat'}
                </button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<div class="card">
  <h2>Attendance check-in</h2>
  <p class="muted" style="margin-bottom: 1rem;">
    When enforced, staff must scan the restaurant's rotating QR code to clock in — the manual
    “Check in” button in their app is disabled. Display the code on a screen at the restaurant via
    <a href="/admin/attendance-code">Attendance code</a>.
  </p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Restaurant</th><th>City</th><th>QR check-in</th><th></th></tr></thead>
      <tbody>
        {#each data.locations as l}
          <tr>
            <td class="font-semibold">{l.name}</td>
            <td>{l.city ?? '—'}</td>
            <td>
              <span class="badge {l.attendance_qr_required ? 'green' : 'gray'}">
                {l.attendance_qr_required ? 'Required' : 'Off'}
              </span>
            </td>
            <td>
              <div class="row-flex">
                <form method="POST" action="?/toggleAttendanceQr" use:enhance>
                  <input type="hidden" name="location_id" value={l.id} />
                  <input type="hidden" name="enabled" value={(!l.attendance_qr_required).toString()} />
                  <button class="btn sm {l.attendance_qr_required ? 'danger' : 'green'}" type="submit">
                    {l.attendance_qr_required ? 'Disable' : 'Require QR'}
                  </button>
                </form>
                <a class="btn sm" href="/admin/attendance-code?location={l.id}" target="_blank">Show code ↗</a>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

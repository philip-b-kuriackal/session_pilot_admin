<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
</script>

<div class="page-head">
  <div>
    <h1>Locations</h1>
    <p>Restaurants in your organization. Click a card to manage its team, departments, roles and responsibilities.</p>
  </div>
</div>

{#if form?.message}
  <div class="alert error">{form.message}</div>
{/if}

<details class="create-panel">
  <summary>+ Add location</summary>
  <div class="panel-body">
    <form method="POST" action="?/create" use:enhance>
      <div class="form-grid">
        <label class="field"><span>Location name *</span><input type="text" name="name" required placeholder="e.g. Little Asia" /></label>
        <label class="field">
          <span>Brand</span>
          <select name="brand_id">
            <option value="">— none —</option>
            {#each data.brands as b}<option value={b.id}>{b.name}</option>{/each}
          </select>
        </label>
        <label class="field"><span>…or create new brand</span><input type="text" name="new_brand" placeholder="New brand name" /></label>
        <label class="field"><span>Address</span><input type="text" name="address" /></label>
        <label class="field"><span>City</span><input type="text" name="city" /></label>
        <label class="field"><span>Postal code</span><input type="text" name="postal_code" /></label>
        <label class="field"><span>Country</span><input type="text" name="country" /></label>
        <label class="field"><span>Phone</span><input type="text" name="phone" /></label>
        <label class="field"><span>Email</span><input type="email" name="email" /></label>
      </div>

      <h3 style="margin: 1.5rem 0 0.75rem; font-size: 1rem; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;">Location Manager (Optional)</h3>
      <div class="form-grid">
        <label class="field"><span>Manager First Name</span><input type="text" name="manager_first_name" placeholder="e.g. John" /></label>
        <label class="field"><span>Manager Last Name</span><input type="text" name="manager_last_name" placeholder="e.g. Doe" /></label>
        <label class="field"><span>Manager Email</span><input type="email" name="manager_email" placeholder="e.g. manager@example.com" /></label>
        <label class="field"><span>Manager Password</span><input type="password" name="manager_password" placeholder="Min 8 characters" /></label>
      </div>
      <div class="form-actions">
        <button class="btn primary" type="submit">Create location</button>
      </div>
    </form>
  </div>
</details>

{#if data.locations.length}
  <div class="loc-grid">
    {#each data.locations as l}
      <a class="loc-card" href="/admin/locations/{l.id}">
        <div class="loc-top">
          <span class="loc-name">{l.name}</span>
          {#if l.brand?.name}<span class="badge orange">{l.brand.name}</span>{/if}
        </div>
        <div class="loc-place muted">
          {[l.city, l.country].filter(Boolean).join(' · ') || 'No address set'}
        </div>
        <div class="loc-foot">
          <span class="badge gray">{l.staff?.[0]?.count ?? 0} staff</span>
          <span class="badge {l.chat_enabled ? 'green' : 'gray'}">chat {l.chat_enabled ? 'on' : 'off'}</span>
        </div>
      </a>
    {/each}
  </div>
{:else}
  <div class="card"><div class="empty">No locations yet. Use “+ Add location” above.</div></div>
{/if}

<style>
  .loc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }
  .loc-card {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    background: #fff;
    border: 1px solid var(--color-border);
    border-radius: 14px;
    padding: 1.1rem 1.2rem;
    text-decoration: none;
    color: inherit;
    transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
  }
  .loc-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    border-color: #b8f45a;
  }
  .loc-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .loc-name { font-size: 1.15rem; font-weight: 800; letter-spacing: -0.3px; }
  .loc-place { font-size: 0.82rem; }
  .loc-foot { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: auto; }
</style>

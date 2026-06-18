<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';
  import { fullName } from '$lib/types';

  let { form } = $props();
  let profile = $derived($page.data.profile);
  let saving = $state(false);
</script>

<svelte:head>
  <title>Your profile</title>
</svelte:head>

<div class="page-container">
  <header class="header">
    <a href="/you" class="close-button">Close</a>
  </header>

  <main class="content">
    <h1 class="page-title">Your profile</h1>

    <!-- Read-only — managed by your admin -->
    <section class="section">
      <h2 class="section-title">Work details</h2>
      <div class="readonly-card">
        <div class="ro-row"><span class="ro-label">Name</span><span class="ro-value">{fullName(profile)}</span></div>
        <div class="ro-row"><span class="ro-label">Email</span><span class="ro-value">{profile?.email ?? '—'}</span></div>
        <div class="ro-row"><span class="ro-label">Position</span><span class="ro-value">{profile?.position ?? '—'}</span></div>
        <div class="ro-row"><span class="ro-label">Restaurant</span><span class="ro-value">{profile?.location?.name ?? '—'}</span></div>
        {#if profile?.hire_date}
          <div class="ro-row"><span class="ro-label">Started</span><span class="ro-value">{new Date(profile.hire_date).toLocaleDateString()}</span></div>
        {/if}
      </div>
      <p class="hint">These are managed by your manager — ask them if something's off.</p>
    </section>

    <!-- Editable -->
    <section class="section">
      <h2 class="section-title">Contact info</h2>
      <form
        method="POST"
        action="?/update"
        use:enhance={() => {
          saving = true;
          return async ({ update }) => {
            saving = false;
            await update();
          };
        }}
      >
        <label class="field">
          <span>Phone</span>
          <input type="tel" name="phone" value={profile?.phone ?? ''} placeholder="+46 70 123 45 67" autocomplete="tel" />
        </label>
        <label class="field">
          <span>Street address</span>
          <input type="text" name="address" value={profile?.address ?? ''} placeholder="Storgatan 1" autocomplete="street-address" />
        </label>
        <div class="field-row">
          <label class="field">
            <span>Postal code</span>
            <input type="text" name="postal_code" value={profile?.postal_code ?? ''} placeholder="111 22" autocomplete="postal-code" />
          </label>
          <label class="field">
            <span>City</span>
            <input type="text" name="city" value={profile?.city ?? ''} placeholder="Stockholm" autocomplete="address-level2" />
          </label>
        </div>
        <label class="field">
          <span>Bank account</span>
          <input type="text" name="bank_account" value={profile?.bank_account ?? ''} placeholder="Clearing + account number" />
        </label>

        {#if form?.message}
          <p class="form-msg" class:ok={form?.success}>{form.message}</p>
        {/if}

        <button type="submit" class="save-btn" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </form>
    </section>
  </main>
</div>

<style>
  .page-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface);
    overflow-y: auto;
  }

  .header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    padding-top: max(16px, env(safe-area-inset-top));
  }

  .close-button {
    font-size: 1rem;
    color: #1f2937;
    text-decoration: none;
    font-weight: 500;
  }

  .content {
    padding: 20px;
    padding-bottom: 60px;
  }

  .page-title {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 24px 0;
    font-family: 'Outfit', var(--font-family-base);
  }

  .section {
    margin-bottom: 28px;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 12px 0;
  }

  .readonly-card {
    background: #f9fafb;
    border-radius: 12px;
    padding: 4px 14px;
  }

  .ro-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #f0f1f3;
  }

  .ro-row:last-child {
    border-bottom: none;
  }

  .ro-label {
    font-size: 0.85rem;
    color: #9ca3af;
  }

  .ro-value {
    font-size: 0.9rem;
    font-weight: 500;
    color: #1f2937;
    text-align: right;
  }

  .hint {
    font-size: 0.78rem;
    color: #9ca3af;
    margin: 8px 2px 0;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field span {
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
  }

  .field input {
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 0.95rem;
    font-family: inherit;
    outline: none;
    width: 100%;
    transition: border-color 0.15s;
  }

  .field input:focus {
    border-color: var(--color-primary);
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 10px;
  }

  .form-msg {
    font-size: 0.85rem;
    color: #b91c1c;
    margin: 0;
  }

  .form-msg.ok {
    color: #16a34a;
  }

  .save-btn {
    margin-top: 4px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 13px;
    font-size: 0.95rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
  }

  .save-btn:disabled {
    opacity: 0.6;
  }
</style>

<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  let loading = $state(false);
</script>

<svelte:head>
  <title>Sign in — SessionPilot Ops</title>
</svelte:head>

<div class="login-page">
  <div class="login-card">
    <div class="logo">
      <div class="logo-mark">SP</div>
      <h1>SessionPilot <span>Ops</span></h1>
    </div>
    <p class="subtitle">Restaurant operations, one place.</p>

    {#if !data.configured}
      <div class="alert">
        Backend not configured. Copy <code>.env.example</code> to <code>.env</code> and add your
        Supabase credentials, then restart the dev server.
      </div>
    {:else}
      <form
        method="POST"
        action="?/login"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            loading = false;
            await update();
          };
        }}
      >
        <label>
          <span>Email</span>
          <input type="email" name="email" placeholder="you@restaurant.com" value={form?.email ?? ''} required autocomplete="email" />
        </label>
        <label>
          <span>Password</span>
          <input type="password" name="password" placeholder="••••••••" required autocomplete="current-password" />
        </label>

        {#if form?.message}
          <div class="alert">{form.message}</div>
        {/if}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    {/if}
  </div>
</div>

<style>
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(160deg, #f07122 0%, #d95e16 60%, #b54a0e 100%);
    padding: 1.5rem;
  }

  .login-card {
    width: 100%;
    max-width: 400px;
    background: #fff;
    border-radius: 20px;
    padding: 2.25rem 2rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-mark {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #f07122, #d95e16);
    color: #fff;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    letter-spacing: -0.5px;
  }

  h1 {
    font-size: 1.4rem;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  h1 span {
    color: #f07122;
  }

  .subtitle {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    margin: 0.75rem 0 1.5rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  label span {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text);
  }

  input {
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 0.7rem 0.85rem;
    font-size: 0.95rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
  }

  input:focus {
    border-color: #f07122;
  }

  button {
    margin-top: 0.25rem;
    background: #f07122;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 0.8rem;
    font-size: 0.95rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
  }

  button:hover:not(:disabled) {
    background: #d95e16;
  }

  button:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .alert {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 0.7rem 0.85rem;
    font-size: 0.85rem;
  }

  .alert code {
    font-size: 0.8rem;
  }
</style>

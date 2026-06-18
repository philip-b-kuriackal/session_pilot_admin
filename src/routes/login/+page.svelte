<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  let loading = $state(false);
  let showPassword = $state(false);
</script>

<svelte:head>
  <title>Sign in — SessionPilot Ops</title>
</svelte:head>

<div class="login-page">
  <main class="login-box">
    <div class="brand">
      <img src="/SP.avif" alt="SessionPilot Ops" class="brand-logo" width="28" height="28" />
      <span class="brand-name">SessionPilot Ops</span>
    </div>

    <h1>Welcome back</h1>
    <p class="subtitle">Sign in to continue</p>

    {#if !data.configured}
      <div class="config-note">
        Backend not configured. Copy <code>.env.example</code> to <code>.env</code>, add your
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
        <input
          type="email"
          name="email"
          placeholder="Email"
          aria-label="Email"
          value={form?.email ?? ''}
          required
          autocomplete="email"
        />
        <div class="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            aria-label="Password"
            required
            autocomplete="current-password"
          />
          <button
            type="button"
            class="toggle-password"
            onclick={() => (showPassword = !showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabindex="-1"
          >
            {#if showPassword}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            {:else}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {/if}
          </button>
        </div>

        {#if form?.message}
          <p class="error" role="alert">{form.message}</p>
        {/if}

        <button type="submit" class="submit" disabled={loading}>
          {#if loading}<span class="spinner"></span>{/if}
          {loading ? 'Signing in' : 'Sign in'}
        </button>
      </form>
    {/if}

    <p class="footnote">SessionPilot Ops</p>
  </main>
</div>

<style>
  .login-page {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    padding: 1.5rem;
  }

  .login-box {
    width: 100%;
    max-width: 340px;
    display: flex;
    flex-direction: column;
    animation: rise 0.4s ease both;
  }

  @keyframes rise {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 2.5rem;
  }

  .brand-logo {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    object-fit: contain;
  }

  .brand-name {
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: -0.2px;
    color: #1a1a1a;
  }

  h1 {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.6px;
    color: #1a1a1a;
  }

  .subtitle {
    color: #999;
    font-size: 0.9rem;
    margin: 0.35rem 0 2rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  input {
    width: 100%;
    border: 1px solid transparent;
    background: #f0f0f0;
    border-radius: 12px;
    padding: 0.85rem 1rem;
    font-size: 0.95rem;
    font-family: inherit;
    color: #1a1a1a;
    outline: none;
    transition: background 0.15s, border-color 0.15s;
  }

  input::placeholder {
    color: #a0a0a0;
  }

  input:focus {
    background: #fff;
    border-color: #1a1a1a;
  }

  .password-field {
    position: relative;
  }

  .toggle-password {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    border: none;
    background: none;
    padding: 0.4rem;
    color: #a0a0a0;
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .toggle-password:hover {
    color: #1a1a1a;
  }

  .error {
    color: #c2410c;
    font-size: 0.82rem;
    padding: 0 0.25rem;
  }

  .submit {
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: #1a1a1a;
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 0.85rem;
    font-size: 0.95rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
  }

  .submit:hover:not(:disabled) {
    background: #333;
  }

  .submit:active:not(:disabled) {
    transform: scale(0.99);
  }

  .submit:disabled {
    opacity: 0.7;
    cursor: default;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .config-note {
    background: #fff;
    border: 1px solid #eaeaea;
    border-radius: 12px;
    padding: 0.85rem 1rem;
    font-size: 0.85rem;
    color: #555;
    line-height: 1.5;
  }

  .config-note code {
    font-size: 0.8rem;
    background: #f0f0f0;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
  }

  .footnote {
    margin-top: 3rem;
    font-size: 0.75rem;
    color: #c0c0c0;
    text-align: center;
  }
</style>

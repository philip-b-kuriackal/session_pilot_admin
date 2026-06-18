<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  let loading = $state(false);
  let showPassword = $state(false);
</script>

<svelte:head>
  <title>Sign in — SessionPilot Ops</title>
</svelte:head>

<div class="login-layout">
  <!-- Left Side: Branding / Showcase -->
  <div class="layout-left">
    <div class="left-brand">
      <img src="/SP.avif" alt="SessionPilot Ops" class="brand-logo-small" width="24" height="24" />
      SessionPilot Ops
    </div>
    
    <!-- Removed placeholder quote -->
  </div>

  <!-- Right Side: Login Form -->
  <div class="layout-right">
    <div class="login-card">
      <div class="header">
        <h1>Welcome back</h1>
        <p class="subtitle">Enter your email to sign in to your account</p>
      </div>

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
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="name@example.com"
              aria-label="Email"
              value={form?.email ?? ''}
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <div class="password-label-wrapper">
              <label for="password">Password</label>
            </div>
            <div class="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                {/if}
              </button>
            </div>
          </div>

          {#if form?.message}
            <p class="error" role="alert">{form.message}</p>
          {/if}

          <button type="submit" class="submit-btn" disabled={loading}>
            {#if loading}
              <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            {/if}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      {/if}

      <p class="footnote">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </p>
    </div>
  </div>
</div>

<style>
  :global(body) {
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    margin: 0;
    padding: 0;
  }

  .login-layout {
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    grid-template-columns: 1fr;
    background-color: #ffffff;
    color: #09090b;
  }

  /* Desktop Split Layout */
  @media (min-width: 1024px) {
    .login-layout {
      grid-template-columns: 1fr 1fr;
    }
  }

  /* Left Side - Dark Green Theme */
  .layout-left {
    display: none; /* Hidden on mobile */
    background-color: #166534; /* Dark green */
    color: #ffffff;
    padding: 2.5rem;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }

  @media (min-width: 1024px) {
    .layout-left {
      display: flex;
    }
  }

  .left-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    font-size: 1.125rem;
    z-index: 20;
  }

  .brand-logo-small {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    object-fit: contain;
    background: white; /* Give logo a white backing if it's dark */
    padding: 2px;
  }

  /* Right Side - Login Form */
  .layout-right {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .login-card {
    width: 100%;
    max-width: 350px;
    display: flex;
    flex-direction: column;
    animation: fade-in 0.3s ease-out both;
  }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .header h1 {
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.025em;
    margin: 0 0 0.375rem 0;
  }

  .header .subtitle {
    font-size: 0.875rem;
    color: #71717a;
    margin: 0;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .password-label-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    height: 2.25rem;
    border: 1px solid #e4e4e7;
    border-radius: 0.375rem;
    background: transparent;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    color: #09090b;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  input::placeholder {
    color: #a1a1aa;
  }

  input:focus-visible {
    border-color: #09090b;
    box-shadow: 0 0 0 1px #09090b;
  }

  .password-field {
    position: relative;
    display: flex;
    align-items: center;
  }

  .toggle-password {
    position: absolute;
    right: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.75rem;
    border: none;
    background: transparent;
    color: #a1a1aa;
    cursor: pointer;
    border-radius: 0 0.375rem 0.375rem 0;
  }

  .toggle-password:hover {
    color: #09090b;
  }

  .toggle-password:focus-visible {
    outline: none;
    color: #09090b;
  }

  .error {
    color: #ef4444;
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0;
  }

  .submit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 2.25rem;
    border: none;
    border-radius: 0.375rem;
    background-color: #166534; /* Dark green */
    color: #ffffff;
    font-size: 0.875rem;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background-color 0.15s, opacity 0.15s;
    width: 100%;
    margin-top: 0.25rem;
  }

  .submit-btn:hover:not(:disabled) {
    background-color: #14532d; /* Hover state for dark green */
  }

  .submit-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #166534;
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .config-note {
    background: #f4f4f5;
    border: 1px solid #e4e4e7;
    border-radius: 0.375rem;
    padding: 0.875rem;
    font-size: 0.875rem;
    color: #3f3f46;
    line-height: 1.5;
    margin-bottom: 1rem;
  }

  .config-note code {
    background: #e4e4e7;
    padding: 0.1rem 0.3rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.8em;
  }

  .footnote {
    margin-top: 2rem;
    font-size: 0.875rem;
    color: #71717a;
    text-align: center;
    line-height: 1.5;
  }

  .footnote a {
    color: #09090b;
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  .footnote a:hover {
    color: #27272a;
  }
</style>

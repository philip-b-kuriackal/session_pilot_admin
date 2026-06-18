<script lang="ts">
  import { enhance } from '$app/forms';
  import { REPORT_KINDS } from '$lib/reports';

  let { data, form } = $props();
  let meta = $derived(REPORT_KINDS[data.kind]);
  let submitting = $state(false);
</script>

<svelte:head>
  <title>{meta.title}</title>
</svelte:head>

<div class="page-container">
  <header class="header">
    <a href="/you/report" class="back-button">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      <span class="header-title">{meta.title}</span>
    </a>
  </header>

  <main class="content">
    <p class="intro">{meta.intro}</p>

    <form
      method="POST"
      action="?kind={data.kind}&/submit"
      class="report-form"
      use:enhance={() => {
        submitting = true;
        return async ({ update }) => {
          submitting = false;
          await update();
        };
      }}
    >
      {#each meta.fields as field, i}
        <div class="question-container">
          {#if field.type === 'checkbox'}
            <label class="checkbox-row">
              <input type="checkbox" name={field.name} />
              <span>{field.label}</span>
            </label>
          {:else}
            <div class="question-number">{i + 1}</div>
            <h2 class="question-title">{field.label}{field.required ? '*' : ''}</h2>
            {#if field.type === 'textarea'}
              <textarea
                class="text-area"
                name={field.name}
                rows="4"
                placeholder={field.placeholder}
                required={field.required}
              ></textarea>
            {:else}
              <input
                type="text"
                class="text-input"
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
              />
            {/if}
          {/if}
        </div>
      {/each}

      {#if form?.message}
        <p class="form-error">{form.message}</p>
      {/if}

      <button type="submit" class="submit-btn" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit report'}
      </button>
    </form>
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
    padding: 16px;
    padding-top: max(16px, env(safe-area-inset-top));
  }

  .back-button {
    display: flex;
    align-items: center;
    color: #1f2937;
    text-decoration: none;
    font-weight: 500;
  }

  .back-button svg {
    margin-right: 8px;
  }

  .header-title {
    font-size: 1rem;
    font-weight: 500;
  }

  .content {
    flex: 1;
    padding: 8px 20px 48px;
  }

  .intro {
    font-size: 0.92rem;
    color: #6b7280;
    margin: 0 0 28px;
  }

  .question-container {
    display: flex;
    flex-direction: column;
    margin-bottom: 28px;
  }

  .question-number {
    width: 24px;
    height: 24px;
    background-color: #6366f1;
    color: white;
    font-size: 0.85rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    margin-bottom: 12px;
  }

  .question-title {
    font-size: 1.15rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 14px 0;
  }

  .text-input {
    width: 100%;
    border: none;
    border-bottom: 2px solid #6366f1;
    padding: 8px 0;
    font-size: 1rem;
    color: #1f2937;
    background: transparent;
    outline: none;
    font-family: inherit;
  }

  .text-input::placeholder {
    color: #d1d5db;
  }

  .text-input:focus {
    border-bottom-color: #4f46e5;
  }

  .text-area {
    width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 0.95rem;
    color: #1f2937;
    font-family: inherit;
    outline: none;
    resize: vertical;
  }

  .text-area:focus {
    border-color: #6366f1;
  }

  .text-area::placeholder {
    color: #d1d5db;
  }

  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.95rem;
    font-weight: 500;
    color: #1f2937;
    cursor: pointer;
  }

  .checkbox-row input {
    width: 18px;
    height: 18px;
    accent-color: #6366f1;
  }

  .form-error {
    color: #b91c1c;
    font-size: 0.85rem;
    margin: 0 0 16px;
  }

  .submit-btn {
    width: 100%;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 12px;
    padding: 14px;
    font-size: 1rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
  }

  .submit-btn:disabled {
    opacity: 0.6;
  }
</style>

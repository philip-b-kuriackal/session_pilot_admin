<script lang="ts">
  import { enhance } from '$app/forms';

  let { form } = $props();

  const CATEGORIES = [
    'Harassment or bullying',
    'Safety concern',
    'Theft or fraud',
    'Discrimination',
    'Food safety violation',
    'Something else'
  ];

  let step = $state(1);
  const TOTAL_STEPS = 3;

  let category = $state('');
  let details = $state('');
  let whenWhere = $state('');
  let anonymous = $state(true);
  let submitting = $state(false);
  let done = $state(false);

  function next() {
    if (step < TOTAL_STEPS) step += 1;
  }

  function back() {
    if (step > 1) step -= 1;
  }
</script>

<svelte:head>
  <title>Whistleblower report</title>
</svelte:head>

<div class="page-container">
  <header class="header">
    <a href="/you/report" class="back-button">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      <span class="header-title">Whistleblower</span>
    </a>
    {#if !done}
      <div class="progress-dots" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
        {#each Array(TOTAL_STEPS) as _, i}
          <span class="dot" class:filled={i < step}></span>
        {/each}
      </div>
    {/if}
  </header>

  <main class="content">
    {#if done}
      <div class="done-screen">
        <div class="done-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2>Report submitted</h2>
        <p>
          Thank you for speaking up. Your report goes directly to organization admins
          {#if anonymous}&nbsp;— <strong>completely anonymously</strong>{/if}.
        </p>
        <a href="/you" class="done-btn">Done</a>
      </div>
    {:else}
      <form
        method="POST"
        action="?/submit"
        use:enhance={() => {
          submitting = true;
          return async ({ update, result }) => {
            submitting = false;
            if (result.type === 'success') done = true;
            await update({ reset: false });
          };
        }}
      >
        <!-- step 1: category -->
        <div class="step" class:hidden={step !== 1}>
          <div class="question-number">1</div>
          <h2 class="question-title">What do you want to report?*</h2>
          <p class="question-subtitle">Your report is confidential. Only organization admins can read it.</p>
          <div class="category-list">
            {#each CATEGORIES as c}
              <button
                type="button"
                class="category-chip"
                class:selected={category === c}
                onclick={() => {
                  category = c;
                  next();
                }}
              >
                {c}
              </button>
            {/each}
          </div>
          <input type="hidden" name="category" value={category} />
        </div>

        <!-- step 2: details -->
        <div class="step" class:hidden={step !== 2}>
          <div class="question-number">2</div>
          <h2 class="question-title">Describe what happened*</h2>
          <p class="question-subtitle">Include as much detail as you're comfortable sharing.</p>
          <textarea
            name="details"
            class="text-area"
            rows="6"
            placeholder="What happened, who was involved…"
            bind:value={details}
          ></textarea>

          <h2 class="question-title small">When and where? <span class="optional">(optional)</span></h2>
          <input
            type="text"
            name="when_where"
            class="text-input"
            placeholder="e.g. Last Friday evening, kitchen"
            bind:value={whenWhere}
          />

          <div class="step-nav">
            <button type="button" class="nav-btn ghost" onclick={back}>Back</button>
            <button type="button" class="nav-btn" disabled={!details.trim()} onclick={next}>Continue</button>
          </div>
        </div>

        <!-- step 3: anonymity + submit -->
        <div class="step" class:hidden={step !== 3}>
          <div class="question-number">3</div>
          <h2 class="question-title">How should we file it?</h2>

          <label class="anon-card" class:active={anonymous}>
            <input type="checkbox" name="anonymous" bind:checked={anonymous} />
            <div>
              <div class="anon-title">Submit anonymously</div>
              <div class="anon-sub">
                {#if anonymous}
                  Your name and location are <strong>not stored</strong> with this report.
                {:else}
                  Your name will be visible to organization admins so they can follow up with you.
                {/if}
              </div>
            </div>
          </label>

          {#if form?.message}
            <p class="form-error">{form.message}</p>
          {/if}

          <div class="step-nav">
            <button type="button" class="nav-btn ghost" onclick={back}>Back</button>
            <button type="submit" class="nav-btn submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </div>
      </form>
    {/if}
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
    justify-content: space-between;
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

  .progress-dots {
    display: flex;
    gap: 6px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e5e7eb;
  }

  .dot.filled {
    background: #6366f1;
  }

  .content {
    flex: 1;
    padding: 24px 20px 48px;
  }

  .step.hidden {
    display: none;
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
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 8px 0;
  }

  .question-title.small {
    font-size: 1rem;
    margin-top: 24px;
  }

  .optional {
    color: #9ca3af;
    font-weight: 400;
    font-size: 0.85rem;
  }

  .question-subtitle {
    font-size: 0.9rem;
    color: #6b7280;
    margin: 0 0 24px 0;
  }

  .category-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .category-chip {
    text-align: left;
    background: #f9fafb;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 0.95rem;
    font-weight: 500;
    color: #1f2937;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.12s, background 0.12s;
  }

  .category-chip:hover {
    border-color: #c7d2fe;
  }

  .category-chip.selected {
    border-color: #6366f1;
    background: #eef2ff;
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

  .text-input::placeholder,
  .text-area::placeholder {
    color: #d1d5db;
  }

  .step-nav {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 32px;
  }

  .nav-btn {
    flex: 1;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 12px;
    padding: 13px;
    font-size: 0.95rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
  }

  .nav-btn:disabled {
    opacity: 0.5;
  }

  .nav-btn.ghost {
    background: #f3f4f6;
    color: #4b5563;
    flex: 0 0 30%;
  }

  .anon-card {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    background: #f9fafb;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: border-color 0.12s;
  }

  .anon-card.active {
    border-color: #6366f1;
    background: #eef2ff;
  }

  .anon-card input {
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: #6366f1;
  }

  .anon-title {
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }

  .anon-sub {
    font-size: 0.85rem;
    color: #6b7280;
    line-height: 1.45;
  }

  .form-error {
    color: #b91c1c;
    font-size: 0.85rem;
    margin: 16px 0 0;
  }

  /* done screen */
  .done-screen {
    text-align: center;
    padding-top: 15vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .done-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #dcfce7;
    color: #16a34a;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .done-screen h2 {
    font-size: 1.4rem;
    font-weight: 700;
    color: #111827;
    margin: 8px 0 0;
  }

  .done-screen p {
    color: #6b7280;
    font-size: 0.95rem;
    max-width: 280px;
    margin: 0;
  }

  .done-btn {
    margin-top: 20px;
    background: #111827;
    color: white;
    text-decoration: none;
    border-radius: 12px;
    padding: 13px 40px;
    font-weight: 700;
    font-size: 0.95rem;
  }
</style>

<script lang="ts">
</script>

<div class="page-container">
  <!-- Header -->
  <header class="header">
    <a href="/you/report" class="back-button">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      <span class="header-title">Whistleblower</span>
    </a>
  </header>

  <main class="content">
    <form class="report-form">
      <!-- Question 1 -->
      <div class="question-container">
        <div class="question-number">1</div>
        <h2 class="question-title">What item is broken?*</h2>
        <p class="question-subtitle">Please describe in detail, or the model name...</p>
        
        <div class="input-wrapper">
          <input 
            type="text" 
            class="text-input" 
            placeholder="Type your answer here..." 
            autofocus 
          />
        </div>
      </div>
    </form>
  </main>
</div>

<style>
  .page-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface);
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
    padding: 24px 20px;
  }

  .question-container {
    display: flex;
    flex-direction: column;
    margin-bottom: 32px;
  }

  .question-number {
    width: 24px;
    height: 24px;
    background-color: #6366f1; /* Indigo/Purple */
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

  .question-subtitle {
    font-size: 0.9rem;
    color: #6b7280;
    margin: 0 0 32px 0;
  }

  .input-wrapper {
    position: relative;
    width: 100%;
  }

  .text-input {
    width: 100%;
    border: none;
    border-bottom: 2px solid #6366f1; /* Purple border matching design */
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
    border-bottom-color: #4f46e5; /* Slightly darker purple on focus */
  }
</style>

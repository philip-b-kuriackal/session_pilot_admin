<script lang="ts">
  import { goto } from '$app/navigation';
  import { slide, fly } from 'svelte/transition';
  import { page } from '$app/stores';
  import { markLessonComplete, QUIZ_KEY } from '../../lessons';

  let brandName = $derived($page.data.brandName ?? 'our restaurant');

  // State Management
  let currentStep = $state(-1); // -1: Landing, 0...N-1: Questions, N: Results
  let selectedOption = $state<number | boolean | null>(null);
  let isAnswerConfirmed = $state(false);
  let lastAnswerCorrect = $state(false);
  let score = $state(0);
  let answers = $state<(number | boolean | null)[]>([]);

  // Mock Questions Data
  let questions = $derived([
    {
      type: 'multiple-choice',
      title: 'Question 1',
      text: `What crucial role do team members play at ${brandName}?`,
      instruction: 'Select the best answer.',
      options: [
        'Creating a welcoming environment for customers and coworkers',
        'Only serving customers efficiently',
        'Managing inventory',
        'Handling all administrative tasks'
      ],
      correctAnswerIndex: 0,
      explanation: `At ${brandName}, every team member is essential for creating a welcoming environment for both customers and coworkers.`
    },
    {
      type: 'multiple-choice',
      title: 'Question 2',
      text: 'What is our primary goal during a rush hour?',
      instruction: 'Select the best answer.',
      options: [
        'Panic and run away',
        'Maintain speed without sacrificing quality or friendliness',
        'Ask customers to come back later',
        'Serve only the drive-thru'
      ],
      correctAnswerIndex: 1,
      explanation: 'Quality and friendliness are our top priorities, even when we are moving fast.'
    },
    {
      type: 'true-false',
      title: 'Question 3',
      text: 'Is communicating openly and professionally important to avoid misunderstandings?',
      instruction: 'Answer true or false.',
      correctAnswerValue: true,
      explanation: 'Clear, open, and professional communication builds a strong team and prevents costly mistakes.'
    }
  ]);

  // Derive total steps (Landing + Questions + Results = 1 + N + 1, but progress bar is just for questions)
  let progressSegments = $derived(questions.length);

  const PASS_THRESHOLD = 2; // pass = at least 2/3 correct
  let passed = $derived(score >= PASS_THRESHOLD);

  function isCorrect(q: (typeof questions)[number], answer: number | boolean | null): boolean {
    return q.type === 'multiple-choice' ? answer === q.correctAnswerIndex : answer === q.correctAnswerValue;
  }

  function startQuiz() {
    currentStep = 0;
    score = 0;
    answers = [];
    selectedOption = null;
    isAnswerConfirmed = false;
  }

  function confirmAnswer() {
    if (selectedOption === null) return;
    isAnswerConfirmed = true;

    // Real scoring — only actually-correct answers count
    lastAnswerCorrect = isCorrect(questions[currentStep], selectedOption);
    if (lastAnswerCorrect) score++;
    answers = [...answers, selectedOption];
  }

  function nextStep() {
    isAnswerConfirmed = false;
    selectedOption = null;
    currentStep++;
    if (currentStep === questions.length && score >= PASS_THRESHOLD) {
      // Quiz passed — persist the completion with the real score
      void markLessonComplete(QUIZ_KEY, score);
    }
  }

  function finishQuiz() {
    // Navigate back to timeline and trigger badge
    goto('/hub/welcome?badgeUnlocked=true');
  }
</script>

<div class="quiz-container">
  
  <!-- Header & Progress -->
  {#if currentStep >= 0 && currentStep < questions.length}
    <div class="quiz-header">
      <button class="close-btn" onclick={() => goto('/hub/welcome')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <div class="progress-bar">
        {#each Array(progressSegments) as _, i}
          <div class="progress-segment {i < currentStep ? 'completed' : i === currentStep ? 'active' : ''}"></div>
        {/each}
      </div>
    </div>
  {:else if currentStep === questions.length}
    <!-- Results Header -->
    <div class="quiz-header">
      <button class="close-btn" onclick={() => goto('/hub/welcome')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <div class="progress-bar">
        {#each Array(progressSegments) as _}
          <div class="progress-segment completed"></div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="content-scrollable">
    
    <!-- LANDING STATE -->
    {#if currentStep === -1}
      <div class="landing-view">
        <button class="close-btn absolute-top" onclick={() => goto('/hub/welcome')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div class="hero-image">
          <img src="/dummy image 4.jpg" alt="{brandName} Team" />
        </div>
        <div class="landing-text">
          <h1>Respect and Teamwork at {brandName} Quiz</h1>
          <p>Test your understanding of the {brandName} guidelines for teamwork and respect.</p>
        </div>
        <div class="bottom-action">
          <button class="btn-primary" onclick={startQuiz}>Start Quiz</button>
        </div>
      </div>

    <!-- QUESTIONS STATE -->
    {:else if currentStep >= 0 && currentStep < questions.length}
      <div class="question-view">
        <span class="question-title">{questions[currentStep].title}</span>
        <h2 class="question-text">{questions[currentStep].text}</h2>
        <p class="question-instruction">{questions[currentStep].instruction}</p>

        <!-- Multiple Choice UI -->
        {#if questions[currentStep].type === 'multiple-choice'}
          <div class="options-list">
            {#each questions[currentStep].options as opt, idx}
              <button 
                class="option-btn {selectedOption === idx ? 'selected' : ''}" 
                onclick={() => { if (!isAnswerConfirmed) selectedOption = idx; }}
              >
                <div class="radio-circle">
                  {#if selectedOption === idx}
                    <div class="radio-inner"></div>
                  {/if}
                </div>
                <span>{opt}</span>
              </button>
            {/each}
          </div>
        {/if}

        <!-- True/False UI -->
        {#if questions[currentStep].type === 'true-false'}
          <div class="tf-container">
            <button 
              class="tf-circle tf-true {selectedOption === true ? 'selected' : ''}"
              onclick={() => { if (!isAnswerConfirmed) selectedOption = true; }}
            >
              <span class="emoji">👍</span>
            </button>
            <div class="tf-circle tf-center">
              <span>This is ...</span>
            </div>
            <button 
              class="tf-circle tf-false {selectedOption === false ? 'selected' : ''}"
              onclick={() => { if (!isAnswerConfirmed) selectedOption = false; }}
            >
              <span class="emoji">👎</span>
            </button>
          </div>
        {/if}

        <!-- Confirm Button (Only show if answer is not confirmed yet) -->
        {#if !isAnswerConfirmed}
          <div class="bottom-action">
            <button class="btn-confirm {selectedOption !== null ? 'active' : ''}" onclick={confirmAnswer} disabled={selectedOption === null}>
              Confirm
            </button>
          </div>
        {/if}
      </div>

    <!-- RESULTS STATE -->
    {:else if currentStep === questions.length}

      <div class="results-view" in:fly={{ y: 20, duration: 400 }}>
        <div class="results-header">
          <div class="alright-graphic">
            <span class="alright-text">{passed ? 'alright!' : 'oh no!'}</span>
          </div>
          <span class="score-label">Score</span>
          <h1 class="score-number">{score}/{questions.length}</h1>
          <p class="score-msg">{passed ? "You're on fire 🔥!" : 'Almost there — give it another try! 💪'}</p>
        </div>

        <div class="review-list">
          {#each questions as q, i}
            {@const provided = answers[i] ?? null}
            {@const gotIt = isCorrect(q, provided)}
            <div class="review-card" class:wrong={!gotIt}>
              <div class="review-header">
                <div class="check-icon" class:wrong={!gotIt}>
                  {#if gotIt}
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {:else}
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  {/if}
                </div>
                <p>{q.text}</p>
              </div>
              <div class="review-details">
                <p><strong>Correct answer:</strong> {q.type === 'multiple-choice' ? q.options?.[q.correctAnswerIndex ?? 0] : q.correctAnswerValue}</p>
                <p><strong>Provided answer:</strong> {q.type === 'multiple-choice' ? (typeof provided === 'number' ? q.options?.[provided] : '—') : provided ?? '—'}</p>
              </div>
            </div>
          {/each}
        </div>

        <div class="bottom-action">
          {#if passed}
            <button class="btn-primary" onclick={finishQuiz}>Finish</button>
          {:else}
            <button class="btn-primary" onclick={startQuiz}>Try Again</button>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- FEEDBACK BOTTOM SHEET -->
  {#if isAnswerConfirmed && currentStep < questions.length}
    <div class="feedback-sheet" class:incorrect={!lastAnswerCorrect} in:slide={{ duration: 300 }} out:slide={{ duration: 300 }}>
      <div class="feedback-header">
        <span class="emoji">{lastAnswerCorrect ? '🎉' : '🤔'}</span>
        <div class="feedback-titles">
          <h3>{lastAnswerCorrect ? 'Excellent!' : 'Not quite!'}</h3>
          <p>{lastAnswerCorrect ? 'That is correct. Good job!' : 'That was not the right answer.'}</p>
        </div>
      </div>
      <div class="feedback-explanation">
        <span class="expl-label">Explanation</span>
        <p>{questions[currentStep].explanation}</p>
      </div>
      <button class="btn-next" onclick={nextStep}>Next</button>
    </div>
  {/if}

</div>

<style>
  .quiz-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    position: relative;
    overflow: hidden;
  }

  .content-scrollable {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .quiz-header {
    display: flex;
    align-items: center;
    padding: calc(1rem + env(safe-area-inset-top)) 1.25rem 1rem;
    gap: 1rem;
  }

  .close-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .absolute-top {
    position: absolute;
    top: calc(1.5rem + env(safe-area-inset-top));
    left: 1.25rem;
    background: white;
    border-radius: 50%;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .progress-bar {
    flex: 1;
    display: flex;
    gap: 6px;
    height: 6px;
  }

  .progress-segment {
    flex: 1;
    background-color: #f0f0f0;
    border-radius: 3px;
    transition: background-color 0.3s;
  }

  .progress-segment.completed {
    background-color: #8ce1a7; /* Light green */
  }

  .progress-segment.active {
    background-color: #4cd964; /* Active green */
  }

  /* LANDING */
  .landing-view {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .hero-image {
    width: 100%;
    height: 35vh;
    border-bottom-left-radius: 24px;
    border-bottom-right-radius: 24px;
    overflow: hidden;
  }

  .hero-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .landing-text {
    padding: 2rem 1.5rem;
    flex: 1;
  }

  .landing-text h1 {
    font-size: 1.8rem;
    font-weight: 800;
    color: #111;
    line-height: 1.2;
    margin: 0 0 1rem 0;
  }

  .landing-text p {
    font-size: 1.05rem;
    color: #555;
    line-height: 1.5;
  }

  /* QUESTIONS */
  .question-view {
    padding: 1.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .question-title {
    font-size: 0.9rem;
    color: #888;
    margin-bottom: 0.5rem;
  }

  .question-text {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111;
    line-height: 1.3;
    margin: 0 0 0.5rem 0;
  }

  .question-instruction {
    font-size: 0.85rem;
    color: #999;
    margin: 0 0 2rem 0;
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .option-btn {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: #f9f9f9;
    border: 1px solid #eee;
    border-radius: 12px;
    text-align: left;
    font-size: 0.95rem;
    color: #444;
    cursor: pointer;
    transition: all 0.2s;
  }

  .option-btn.selected {
    background-color: #eaf8ed;
    border-color: #8ce1a7;
    color: #111;
  }

  .radio-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .option-btn.selected .radio-circle {
    border-color: #8ca3ce;
  }

  .radio-inner {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #8ca3ce; /* Purpleish selected inner */
  }

  /* TRUE FALSE UI */
  .tf-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2rem;
    gap: 1rem;
    position: relative;
  }

  .tf-circle {
    width: 110px;
    height: 110px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    border: none;
    cursor: pointer;
    transition: transform 0.2s, opacity 0.2s;
  }

  .tf-circle.selected {
    transform: scale(1.1);
  }

  .tf-true {
    background-color: #eafaf1;
    z-index: 1;
  }

  .tf-false {
    background-color: #fdf2f2;
    z-index: 1;
  }

  .tf-center {
    width: 100px;
    height: 100px;
    background-color: #5d48d6;
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    z-index: 2;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    box-shadow: 0 4px 15px rgba(93, 72, 214, 0.3);
  }

  /* ACTIONS */
  .bottom-action {
    padding: 1.5rem;
    margin-top: auto;
  }

  .btn-primary {
    width: 100%;
    padding: 1rem;
    background-color: #df9ebc; /* Pinkish color */
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-confirm {
    width: 100%;
    padding: 1rem;
    background-color: #aaa;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: not-allowed;
    transition: background-color 0.3s;
  }

  .btn-confirm.active {
    background-color: #999; /* Greyed out but active looking */
    cursor: pointer;
  }

  /* FEEDBACK SHEET */
  .feedback-sheet.incorrect {
    background-color: #fecaca; /* Light red */
  }

  .feedback-sheet {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: #bbf7d0; /* Light green */
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    padding: 2rem 1.5rem 1.5rem;
    z-index: 50;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  }

  .feedback-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .feedback-header .emoji {
    font-size: 2.5rem;
  }

  .feedback-titles h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.3rem;
    font-weight: 800;
    color: #111;
  }

  .feedback-titles p {
    margin: 0;
    font-size: 0.95rem;
    color: #222;
  }

  .feedback-explanation {
    background-color: rgba(255,255,255,0.4);
    border: 1px solid rgba(0,0,0,0.05);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .expl-label {
    font-size: 0.75rem;
    color: #555;
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 0.5rem;
    display: block;
  }

  .feedback-explanation p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.4;
    color: #111;
  }

  .btn-next {
    width: 100%;
    padding: 1rem;
    background-color: #1a1a1a;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
  }

  /* RESULTS VIEW */
  .results-view {
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    flex: 1;
    background: linear-gradient(to bottom, #f9f9f9, #fff);
  }

  .results-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
  }

  .alright-graphic {
    background-color: #f7cb73;
    padding: 10px 20px;
    border: 2px solid #111;
    border-radius: 8px;
    transform: rotate(-5deg);
    margin-bottom: 2rem;
    box-shadow: 2px 2px 0 #111;
  }

  .alright-text {
    font-weight: 900;
    font-size: 1.2rem;
    color: #111;
  }

  .score-label {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.5rem;
  }

  .score-number {
    font-size: 3.5rem;
    font-weight: 900;
    color: #111;
    margin: 0 0 0.5rem 0;
    line-height: 1;
  }

  .score-msg {
    font-size: 1.1rem;
    color: #111;
    font-weight: 500;
    margin: 0;
  }

  .review-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .review-card {
    background-color: #d1fae5; /* Greenish */
    border-radius: 16px;
    padding: 1.25rem;
  }

  .review-card.wrong {
    background-color: #fee2e2; /* Reddish */
  }

  .review-header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .check-icon.wrong {
    background-color: #ef4444;
  }

  .check-icon {
    width: 24px;
    height: 24px;
    background-color: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .check-icon svg {
    width: 14px;
    height: 14px;
  }

  .review-header p {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #111;
  }

  .review-details p {
    margin: 0 0 0.5rem 0;
    font-size: 0.85rem;
    color: #333;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  
  let { onClose } = $props<{ onClose: () => void }>();
  
  let showConfetti = $state(true);

  // Generate some random confetti pieces
  const confettiPieces = Array.from({ length: 80 }).map(() => ({
    x: Math.random() * 100,
    color: ['#ff4d4f', '#52c41a', '#1890ff', '#faad14', '#eb2f96', '#13c2c2'][Math.floor(Math.random() * 6)],
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 3
  }));
</script>

<div class="modal-overlay">
  <!-- Confetti Layer -->
  {#if showConfetti}
    <div class="confetti-container">
      {#each confettiPieces as piece}
        <div 
          class="confetti-piece"
            style="
              left: {piece.x}%; 
              background-color: {piece.color};
              animation-duration: {piece.duration}s;
              animation-delay: {piece.delay}s;
            "
        ></div>
      {/each}
    </div>
  {/if}

  <!-- Modal Content -->
  <div class="modal-content animate-pop">
    <div class="badge-graphic">
      <img src="/dummy image 4.jpg" alt="Onboarding Complete Badge" class="badge-img" />
      <!-- Overlay text to match the design (or assume the image has it) -->
      <div class="badge-text-overlay">
        <span>ONBOARDING</span>
        <span class="bold">COMPLETE!</span>
      </div>
    </div>

    <div class="modal-text">
      <p class="subtitle">You earned the</p>
      <h2>"Onboarding Badge"</h2>
      <p class="description">
        Congratulations on completing your onboarding! We're super excited to have you on board.
      </p>
    </div>

    <button class="close-btn" onclick={onClose}>Close</button>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .confetti-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
    z-index: 10000;
  }

  .confetti-piece {
    position: absolute;
    top: -30px;
    width: 12px;
    height: 24px;
    opacity: 0.9;
    animation-name: fall;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }

  @keyframes fall {
    0% {
      transform: translateY(-50px) rotate(0deg);
    }
    100% {
      transform: translateY(120vh) rotate(720deg);
    }
  }

  .modal-content {
    background-color: #fffaf0; /* Light cream to match screenshot */
    border-radius: 24px;
    padding: 2.5rem 1.5rem 1.5rem;
    width: 100%;
    max-width: 360px;
    text-align: center;
    position: relative;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    z-index: 10001;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .animate-pop {
    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes popIn {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .badge-graphic {
    position: absolute;
    top: -60px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-color: #fff;
    box-shadow: 0 4px 15px rgba(230, 100, 32, 0.3);
    border: 4px solid white;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .badge-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .badge-text-overlay {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(230, 100, 32, 0.85); /* Popeyes orange */
    color: white;
    width: 100%;
    padding: 10px 0;
    transform: rotate(-10deg);
    font-size: 0.6rem;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .badge-text-overlay .bold {
    font-weight: 800;
    font-size: 0.75rem;
  }

  .modal-text {
    margin-top: 3rem;
  }

  .subtitle {
    font-size: 0.9rem;
    color: #666;
    margin: 0 0 0.25rem 0;
  }

  h2 {
    font-size: 1.6rem;
    color: #111;
    margin: 0 0 1rem 0;
    font-weight: 700;
  }

  .description {
    font-size: 0.95rem;
    line-height: 1.5;
    color: #555;
    margin-bottom: 2rem;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #b54a81; /* Pinkish color matching screenshot */
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    padding: 10px 20px;
    transition: opacity 0.2s;
  }

  .close-btn:active {
    opacity: 0.7;
  }
</style>

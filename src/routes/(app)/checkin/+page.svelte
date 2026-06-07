<script lang="ts">
  let { data } = $props();

  const messages: Record<string, { emoji: string; title: string; body: string }> = {
    invalid: {
      emoji: '⌛',
      title: 'Code expired',
      body: 'That QR code is no longer valid. Scan the live code on the restaurant screen again.'
    },
    wrong_location: {
      emoji: '📍',
      title: 'Wrong restaurant',
      body: 'This code belongs to a different restaurant than the one you’re assigned to.'
    },
    already: {
      emoji: '✅',
      title: 'Already checked in',
      body: 'You’re already on the clock. Head to the feed to see your timer.'
    },
    error: {
      emoji: '⚠️',
      title: 'Could not check in',
      body: data.message ?? 'Something went wrong. Please try again.'
    }
  };

  let m = $derived(messages[data.status] ?? messages.error);
</script>

<div class="checkin-page">
  <div class="checkin-card">
    <div class="emoji">{m.emoji}</div>
    <h1>{m.title}</h1>
    <p>{m.body}</p>
    <a class="back-btn" href="/">Back to app</a>
  </div>
</div>

<style>
  .checkin-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--color-background);
  }
  .checkin-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 18px;
    padding: 32px 24px;
    text-align: center;
    max-width: 360px;
    width: 100%;
  }
  .emoji { font-size: 2.4rem; }
  h1 { font-size: 1.25rem; font-weight: 800; margin: 10px 0 6px; }
  p { font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 20px; }
  .back-btn {
    display: inline-block;
    background: var(--color-primary);
    color: #fff;
    text-decoration: none;
    font-weight: 700;
    padding: 12px 24px;
    border-radius: 12px;
  }
</style>

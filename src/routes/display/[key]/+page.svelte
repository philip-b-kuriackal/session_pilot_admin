<script lang="ts">
  import QRCode from 'qrcode';
  import { page } from '$app/stores';

  let { data } = $props();

  let qrDataUrl = $state('');
  let secondsLeft = $state(5);
  let err = $state('');

  async function refresh() {
    try {
      const res = await fetch(`/display/${$page.params.key}/token`);
      if (!res.ok) throw new Error(String(res.status));
      const { token } = await res.json();
      const checkinUrl = `${$page.url.origin}/checkin?t=${encodeURIComponent(token)}`;
      qrDataUrl = await QRCode.toDataURL(checkinUrl, {
        width: 520,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#111318', light: '#ffffff' }
      });
      err = '';
    } catch {
      err = 'Reconnecting…';
    }
  }

  $effect(() => {
    refresh();
    const r = setInterval(refresh, 5000);
    secondsLeft = 5;
    const t = setInterval(() => (secondsLeft = secondsLeft <= 1 ? 5 : secondsLeft - 1), 1000);
    return () => {
      clearInterval(r);
      clearInterval(t);
    };
  });
</script>

<svelte:head>
  <title>Check in — {data.locationName}</title>
</svelte:head>

<div class="screen">
  <div class="brand">SessionPilot <span>Ops</span></div>
  <h1 class="loc">{data.locationName}</h1>

  <div class="qr-box">
    {#if qrDataUrl}
      <img class="qr" src={qrDataUrl} alt="Attendance QR code" />
    {:else}
      <div class="qr placeholder">…</div>
    {/if}
  </div>

  <div class="cta">📷 Scan with your phone camera to check in</div>
  <div class="meta">
    <span class="dot"></span>
    {err || `Refreshes in ${secondsLeft}s`}
  </div>
</div>

<style>
  :global(body) { margin: 0; }

  .screen {
    min-height: 100vh;
    background: radial-gradient(circle at 50% 30%, #1c1f26 0%, #0c0e12 100%);
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    padding: 4vh 4vw;
    text-align: center;
  }

  .brand {
    font-size: clamp(1rem, 2.5vw, 1.5rem);
    font-weight: 700;
    letter-spacing: -0.3px;
    opacity: 0.85;
  }
  .brand span { color: #ccfc7e; }

  .loc {
    font-size: clamp(1.8rem, 6vw, 3.4rem);
    font-weight: 800;
    letter-spacing: -1px;
    margin: 0;
  }

  .qr-box {
    background: #fff;
    padding: clamp(16px, 3vw, 32px);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  .qr {
    width: clamp(240px, 42vw, 460px);
    height: clamp(240px, 42vw, 460px);
    display: block;
  }

  .qr.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9da3ae;
    font-size: 3rem;
  }

  .cta {
    font-size: clamp(1rem, 3vw, 1.6rem);
    font-weight: 600;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: clamp(0.8rem, 2vw, 1rem);
    opacity: 0.7;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #1a9e4e;
    animation: pulse 1.6s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.25; }
  }
</style>

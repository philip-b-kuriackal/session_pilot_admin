<script lang="ts">
  import QRCode from 'qrcode';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';
  import { confirmSubmit } from '$lib/admin/ux';

  let { data } = $props();

  let copied = $state(false);
  let publicUrl = $derived(data.displayKey ? `${$page.url.origin}/display/${data.displayKey}` : '');

  async function copyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {
      copied = false;
    }
  }

  let qrDataUrl = $state('');
  let secondsLeft = $state(5);
  let error = $state('');

  let location = $derived(data.locations.find((l: any) => l.id === data.locationId) ?? null);
  let required = $derived(location?.attendance_qr_required ?? false);

  async function refresh() {
    if (!data.locationId) return;
    try {
      const res = await fetch(`/admin/attendance-code/token?location=${data.locationId}`);
      if (!res.ok) throw new Error(String(res.status));
      const { token } = await res.json();
      const checkinUrl = `${$page.url.origin}/checkin?t=${encodeURIComponent(token)}`;
      qrDataUrl = await QRCode.toDataURL(checkinUrl, {
        width: 440,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#111318', light: '#ffffff' }
      });
      error = '';
    } catch {
      error = 'Could not refresh the code — check the connection.';
    }
  }

  // refresh every 5s while mounted; tick a countdown for the ring
  $effect(() => {
    // re-run when the selected location changes
    data.locationId;
    refresh();
    const refreshTimer = setInterval(refresh, 5000);
    secondsLeft = 5;
    const tick = setInterval(() => {
      secondsLeft = secondsLeft <= 1 ? 5 : secondsLeft - 1;
    }, 1000);
    return () => {
      clearInterval(refreshTimer);
      clearInterval(tick);
    };
  });
</script>

<div class="page-head">
  <div>
    <h1>Attendance code</h1>
    <p>Display this screen at the restaurant. Staff scan it with their phone to check in.</p>
  </div>
  <form method="GET">
    <select name="location" onchange={(e) => goto(`/admin/attendance-code?location=${(e.currentTarget as HTMLSelectElement).value}`)}>
      {#each data.locations as l}
        <option value={l.id} selected={l.id === data.locationId}>{l.name}</option>
      {/each}
    </select>
  </form>
</div>

{#if !required}
  <div class="alert" style="background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--border);">
    QR check-in is <strong>not enforced</strong> for {location?.name ?? 'this location'} yet — staff can still
    check in with the button in their app. Turn on “Require QR to check in” in
    <a href="/admin/settings">Settings</a> to make scanning mandatory.
  </div>
{/if}

<div class="card">
  <h2>Public display link</h2>
  <p class="muted" style="margin-bottom: 0.8rem;">
    Open this on any external screen or tablet at <strong>{location?.name ?? 'this location'}</strong> — no login
    needed. It shows the same live, rotating QR. Keep it private: anyone with the link can display this
    restaurant's check-in code.
  </p>
  {#if publicUrl}
    <div class="link-row">
      <input type="text" readonly value={publicUrl} onfocus={(e) => e.currentTarget.select()} />
      <button class="btn primary" type="button" onclick={copyLink}>{copied ? 'Copied ✓' : 'Copy link'}</button>
      <a class="btn" href={publicUrl} target="_blank" rel="noopener">Open ↗</a>
      <form
        method="POST"
        action="?/rotateKey"
        use:enhance
        onsubmit={confirmSubmit({
          message: 'Generate a new link? The current link will stop working.',
          title: 'Rotate attendance link?',
          confirmLabel: 'Generate new link',
          danger: true
        })}
      >
        <input type="hidden" name="location_id" value={data.locationId} />
        <button class="btn danger" type="submit">Rotate</button>
      </form>
    </div>
  {/if}
</div>

<div class="qr-stage">
  {#if error}
    <div class="alert error">{error}</div>
  {/if}
  <div class="qr-card">
    <div class="qr-loc">{location?.name ?? '—'}</div>
    {#if qrDataUrl}
      <img class="qr-img" src={qrDataUrl} alt="Attendance QR code" />
    {:else}
      <div class="qr-img placeholder">…</div>
    {/if}
    <div class="qr-meta">
      <span class="dot"></span>
      Refreshes in {secondsLeft}s
    </div>
    <p class="qr-hint">Open your phone camera and point it at this code to check in.</p>
  </div>
</div>

<style>
  .link-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .link-row input {
    flex: 1;
    min-width: 220px;
    font-family: ui-monospace, monospace;
    font-size: 0.82rem;
  }
  .link-row form { display: contents; }

  .qr-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .qr-card {
    background: var(--surface);
    box-shadow: var(--card-shadow);
    border-radius: var(--radius);
    padding: 2rem 2.5rem 1.6rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.9rem;
    max-width: 540px;
    width: 100%;
  }

  .qr-loc {
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: -0.3px;
  }

  .qr-img {
    width: 360px;
    height: 360px;
    max-width: 78vw;
    border-radius: var(--radius-sm);
  }

  .qr-img.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
    color: var(--muted-2);
    font-size: 2rem;
  }

  .qr-meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--muted);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success);
    animation: pulse 1.6s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .qr-hint {
    font-size: 0.82rem;
    color: var(--muted);
    text-align: center;
  }
</style>

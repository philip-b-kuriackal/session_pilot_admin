<script lang="ts">
  import jsQR from 'jsqr';

  let { onClose } = $props<{ onClose: () => void }>();

  let videoEl: HTMLVideoElement;
  let canvasEl: HTMLCanvasElement;
  let status = $state<'starting' | 'scanning' | 'denied' | 'insecure' | 'nocamera' | 'found'>('starting');
  let stream: MediaStream | null = null;
  let raf = 0;

  /** Pull the attendance token out of a scanned value (full URL or bare token). */
  function extractToken(text: string): string | null {
    try {
      const u = new URL(text);
      const t = u.searchParams.get('t');
      if (t) return t;
    } catch {
      // not a URL
    }
    // bare token form: locationId.bucket.sig
    if (/^[0-9a-f-]+\.\d+\.[0-9a-f]+$/i.test(text.trim())) return text.trim();
    return null;
  }

  function tick() {
    if (status !== 'scanning' || !videoEl || videoEl.readyState !== videoEl.HAVE_ENOUGH_DATA) {
      raf = requestAnimationFrame(tick);
      return;
    }
    const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
    const img = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    if (code) {
      const token = extractToken(code.data);
      if (token) {
        status = 'found';
        stop();
        // hand off to the deep-link route, which validates + clocks in
        window.location.href = `/checkin?t=${encodeURIComponent(token)}`;
        return;
      }
    }
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  }

  $effect(() => {
    // Camera requires a secure context (HTTPS or localhost)
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      status = 'insecure';
      return;
    }
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
        videoEl.srcObject = stream;
        await videoEl.play();
        status = 'scanning';
        raf = requestAnimationFrame(tick);
      } catch (e) {
        status = (e as DOMException)?.name === 'NotAllowedError' ? 'denied' : 'nocamera';
      }
    })();
    return stop;
  });
</script>

<div class="scan-overlay" role="dialog" aria-modal="true" aria-label="Scan check-in QR">
  <div class="scan-head">
    <span>Scan the check-in code</span>
    <button class="scan-close" type="button" onclick={() => { stop(); onClose(); }} aria-label="Close scanner">×</button>
  </div>

  <div class="scan-stage">
    <!-- svelte-ignore a11y_media_has_caption -->
    <video bind:this={videoEl} playsinline muted class:hide={status !== 'scanning' && status !== 'found'}></video>
    <canvas bind:this={canvasEl} class="hidden"></canvas>

    {#if status === 'scanning'}
      <div class="reticle"></div>
    {/if}

    {#if status === 'starting'}
      <div class="scan-msg">Starting camera…</div>
    {:else if status === 'found'}
      <div class="scan-msg">✓ Code found — checking you in…</div>
    {:else if status === 'denied'}
      <div class="scan-msg">
        <strong>Camera blocked</strong>
        <p>Allow camera access in your browser, or point your phone's camera app at the code on the restaurant screen.</p>
      </div>
    {:else if status === 'insecure'}
      <div class="scan-msg">
        <strong>Use your camera app</strong>
        <p>In-app scanning needs a secure (HTTPS) connection. For now, open your phone's camera and point it at the QR on the restaurant screen — it’ll check you in.</p>
      </div>
    {:else if status === 'nocamera'}
      <div class="scan-msg">
        <strong>No camera available</strong>
        <p>Point your phone's camera app at the code on the restaurant screen instead.</p>
      </div>
    {/if}
  </div>

  {#if status === 'scanning'}
    <p class="scan-hint">Point at the QR code on the restaurant screen</p>
  {/if}
</div>

<style>
  .scan-overlay {
    position: absolute;
    inset: 0;
    z-index: 400;
    background: #0c0e12;
    color: #fff;
    display: flex;
    flex-direction: column;
  }

  .scan-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    padding-top: max(16px, env(safe-area-inset-top));
    font-weight: 700;
    font-size: 0.95rem;
  }

  .scan-close {
    background: rgba(255, 255, 255, 0.12);
    border: none;
    color: #fff;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    font-size: 1.3rem;
    line-height: 1;
    cursor: pointer;
  }

  .scan-stage {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  video.hide { display: none; }
  .hidden { display: none; }

  .reticle {
    position: absolute;
    width: 62%;
    aspect-ratio: 1;
    border: 3px solid rgba(255, 255, 255, 0.9);
    border-radius: 18px;
    box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.45);
  }

  .scan-msg {
    position: absolute;
    text-align: center;
    padding: 24px;
    max-width: 320px;
  }

  .scan-msg strong { font-size: 1.05rem; display: block; margin-bottom: 6px; }
  .scan-msg p { font-size: 0.85rem; opacity: 0.8; line-height: 1.5; }

  .scan-hint {
    text-align: center;
    padding: 16px;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
    font-size: 0.85rem;
    opacity: 0.8;
  }
</style>

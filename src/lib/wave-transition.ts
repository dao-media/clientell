/**
 * Ink takeover between the portfolio and a project's sandbox (ClienTell), both ways: the next page
 * bleeds in through an ink-spread matte (Adobe Stock 1775439501, its first take) until it fills
 * the window, then the browser navigates to it for real.
 *
 * How: the destination loads ahead of time in a full-window iframe, inside a layer masked by a
 * sprite sheet of the matte's frames (/transitions/ink.webp: 38 frames at 25 fps, 480×270 each,
 * 8 across × 5 down, the spare cells after the last frame left empty; alpha = where the new page shows, i.e. the source's black, its white being
 * the page you're leaving). On the click the layer's mask steps through the frames, so the
 * framed page spreads in with the ink's soft edges, droplets and wisps intact. At full cover the
 * framed page is the whole window, and the real navigation swaps in the same page underneath.
 * The masked layer is cover-fitted 16:9 (bigger than the window, centred) so the ink never
 * stretches; the iframe inside it is offset back to the window.
 *
 * The sandbox uses the same matte turned 180° (its own copy of the sprite) for the way back.
 *
 * The iframe starts loading on hover, focus or touch of a[data-wave]; if it or the sprite isn't
 * ready within a few seconds of the click, the link just navigates. Reduced motion: plain
 * navigation. A page restored by Back/Forward drops the layer. The two sites allow each other in
 * frame-ancestors.
 *
 * Copied from the portfolio (dao-media/portfolio-2lite, src/components/ui/behaviors/waveTransition.ts);
 * keep the two in step.
 */

export type WaveOptions = {
  /** Sprite sheet of mask frames (alpha = the new page shows), laid out row by row. */
  sprite: string;
  cols: number;
  rows: number;
  frames: number;
  fps: number;
  rate?: number;
  timeoutMs?: number;
};

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function initWaveTransition({ sprite, cols, rows, frames, fps, rate = 1, timeoutMs = 4000 }: WaveOptions) {
  let spriteP: Promise<boolean> | null = null;
  const loadSprite = () =>
    (spriteP ??= (() => {
      const img = new Image();
      img.src = sprite;
      return img.decode().then(() => true, () => false);
    })());

  let layer: HTMLDivElement | null = null;
  let frame: HTMLIFrameElement | null = null;
  let frameFor = '';
  let frameReady: Promise<boolean> = Promise.resolve(false);
  let busy = false;

  const teardown = () => {
    layer?.remove();
    layer = frame = null;
    frameFor = '';
    busy = false;
  };

  const setMask = (prop: string, value: string) => {
    layer?.style.setProperty(`mask-${prop}`, value);
    layer?.style.setProperty(`-webkit-mask-${prop}`, value);
  };

  /** Show mask frame i (0 = the first of the spread, frames - 1 = all of it; -1 = an empty spare cell). */
  const show = (n: number) => {
    const i = n < 0 ? cols * rows - 1 : n;
    const x = cols > 1 ? ((i % cols) / (cols - 1)) * 100 : 0;
    const y = rows > 1 ? (Math.floor(i / cols) / (rows - 1)) * 100 : 0;
    setMask('position', `${x}% ${y}%`);
  };

  /** Cover-fit the 16:9 masked layer to the window, and keep the iframe on the window. */
  function fit() {
    if (!layer || !frame) return;
    const w = innerWidth;
    const h = innerHeight;
    const lw = Math.max(w, (h * 16) / 9);
    const lh = (lw * 9) / 16;
    const left = (w - lw) / 2;
    const top = (h - lh) / 2;
    Object.assign(layer.style, { left: `${left}px`, top: `${top}px`, width: `${lw}px`, height: `${lh}px` });
    Object.assign(frame.style, { left: `${-left}px`, top: `${-top}px`, width: `${w}px`, height: `${h}px` });
  }

  /** Load `href` in the hidden, fully masked takeover layer (once per destination). */
  function prepare(href: string) {
    loadSprite();
    if (frameFor === href || busy) return;
    teardown();
    layer = document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    Object.assign(layer.style, { position: 'fixed', zIndex: '2147483647', pointerEvents: 'none', overflow: 'hidden', visibility: 'hidden' });
    setMask('image', `url("${sprite}")`);
    setMask('size', `${cols * 100}% ${rows * 100}%`);
    setMask('repeat', 'no-repeat');
    show(-1);
    frame = document.createElement('iframe');
    frame.tabIndex = -1;
    frame.title = 'Next page';
    Object.assign(frame.style, { position: 'absolute', border: '0', display: 'block' });
    const f = frame;
    frameReady = new Promise((res) => f.addEventListener('load', () => res(true), { once: true }));
    f.src = href;
    frameFor = href;
    layer.appendChild(f);
    document.body.appendChild(layer);
    fit();
  }

  async function takeover(href: string) {
    busy = true;
    const timeout = sleep(timeoutMs).then(() => false);
    const ok = (await Promise.race([loadSprite(), timeout])) && (await Promise.race([frameReady, timeout]));
    if (!ok || !layer) {
      location.href = href;
      return;
    }
    // Sprite decoded: show the layer on its empty cell, and give the framed page a moment to paint.
    const el = layer;
    el.style.visibility = 'visible';
    el.style.pointerEvents = 'auto'; // nothing underneath takes clicks mid-spread
    await sleep(150);
    addEventListener('resize', fit);
    const last = frames - 1;
    const ms = (last / fps / rate) * 1000;
    await new Promise<void>((done) => {
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / ms);
        show(Math.round(k * last));
        if (k < 1) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    });
    removeEventListener('resize', fit);
    // Full cover: the framed page is the window. Navigate underneath it.
    setMask('image', 'none');
    location.href = href;
  }

  const target = (e: Event) => (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[data-wave]') ?? null;
  const warm = (e: Event) => {
    const a = target(e);
    if (a && !reduced()) prepare(a.href);
  };
  document.addEventListener('pointerover', warm, { passive: true });
  document.addEventListener('touchstart', warm, { passive: true });
  document.addEventListener('focusin', warm);
  addEventListener('resize', fit);

  document.addEventListener('click', (e) => {
    const a = target(e);
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (reduced() || busy) return;
    e.preventDefault();
    prepare(a.href);
    void takeover(a.href);
  });

  // Back/Forward can restore this page mid-takeover: drop the layer.
  addEventListener('pageshow', (e) => {
    if (e.persisted) teardown();
  });
}

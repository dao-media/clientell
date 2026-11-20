/**
 * Wave line takeover between the portfolio and a project's sandbox (ClienTell), both ways: the
 * next page sweeps in through the lines of CGStation's "Line Transition – Wave 09" until it fills
 * the window, then the browser navigates to it for real.
 *
 * How: the destination loads ahead of time in a full-window iframe, clipped to nothing. On the
 * click, an SVG clipPath steps through the wave's cover frames (the matte's alpha traced to vector
 * paths with potrace: /transitions/wave-09.json, 61 frames at 30 fps in a 1280×720 space,
 * cover-fitted to the window), so the iframe shows through the lines as they widen. At full cover
 * the iframe is the whole window, and the real navigation swaps in the same page underneath.
 * Vector paths keep the line edges crisp at any window size.
 *
 * The iframe starts loading on hover, focus or touch of a[data-wave]; if it isn't ready within a
 * few seconds of the click, the link just navigates. Reduced motion: plain navigation. A page
 * restored by Back/Forward drops the takeover. The two sites allow each other in frame-ancestors.
 *
 * Copied from the portfolio (dao-media/portfolio-2lite, src/components/ui/behaviors/waveTransition.ts);
 * keep the two in step.
 */

type Frames = { w: number; h: number; fps: number; frames: string[] };
export type WaveOptions = { frames: string; rate?: number; timeoutMs?: number };

const SVG = 'http://www.w3.org/2000/svg';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function initWaveTransition({ frames: framesUrl, rate = 1.5, timeoutMs = 4000 }: WaveOptions) {
  let framesP: Promise<Frames | null> | null = null;
  const loadFrames = () =>
    (framesP ??= fetch(framesUrl)
      .then((r) => (r.ok ? (r.json() as Promise<Frames>) : null))
      .catch(() => null));

  let layer: HTMLDivElement | null = null;
  let svg: SVGSVGElement | null = null;
  let path: SVGPathElement | null = null;
  let frameFor = '';
  let frameReady: Promise<boolean> = Promise.resolve(false);
  let busy = false;

  const teardown = () => {
    layer?.remove();
    svg?.remove();
    layer = svg = path = null;
    frameFor = '';
    busy = false;
  };

  /** Load `href` in the hidden, fully clipped takeover layer (once per destination). */
  function prepare(href: string) {
    loadFrames();
    if (frameFor === href || busy) return;
    teardown();
    const id = `wave-clip-${Math.random().toString(36).slice(2, 8)}`;
    svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    const clip = document.createElementNS(SVG, 'clipPath');
    clip.id = id;
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    path = document.createElementNS(SVG, 'path');
    path.setAttribute('clip-rule', 'evenodd');
    path.setAttribute('d', '');
    clip.appendChild(path);
    svg.appendChild(clip);

    layer = document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    const s = layer.style;
    s.position = 'fixed';
    s.inset = '0';
    s.zIndex = '2147483647';
    s.pointerEvents = 'none';
    s.clipPath = `url(#${id})`;
    s.setProperty('-webkit-clip-path', `url(#${id})`);
    const frame = document.createElement('iframe');
    frame.tabIndex = -1;
    frame.title = 'Next page';
    Object.assign(frame.style, { width: '100%', height: '100%', border: '0', display: 'block' });
    frameReady = new Promise((res) => frame.addEventListener('load', () => res(true), { once: true }));
    frame.src = href;
    frameFor = href;
    layer.appendChild(frame);
    document.body.appendChild(svg);
    document.body.appendChild(layer);
  }

  /** Cover-fit the 16:9 path space to the window. */
  function fit(f: Frames) {
    const w = innerWidth;
    const h = innerHeight;
    const k = Math.max(w / f.w, h / f.h);
    path?.setAttribute('transform', `translate(${(w - f.w * k) / 2} ${(h - f.h * k) / 2}) scale(${k})`);
  }

  async function takeover(href: string) {
    busy = true;
    const timeout = sleep(timeoutMs).then(() => null);
    const f = await Promise.race([loadFrames(), timeout]);
    const ok = f && (await Promise.race([frameReady, timeout]));
    if (!f || !ok || !layer || !path) {
      location.href = href;
      return;
    }
    await sleep(120); // let the framed page paint
    layer.style.pointerEvents = 'auto'; // nothing underneath takes clicks mid-sweep
    fit(f);
    const onResize = () => fit(f);
    addEventListener('resize', onResize);
    const last = f.frames.length - 1;
    const ms = (last / f.fps / rate) * 1000;
    const p = path;
    await new Promise<void>((done) => {
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / ms);
        p.setAttribute('d', f.frames[Math.round(k * last)]);
        if (k < 1) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    });
    removeEventListener('resize', onResize);
    // Full cover: the framed page is the window. Navigate underneath it.
    layer.style.clipPath = 'none';
    layer.style.setProperty('-webkit-clip-path', 'none');
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

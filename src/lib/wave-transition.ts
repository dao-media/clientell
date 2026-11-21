/**
 * Fluid wipe takeover between the portfolio and a project's sandbox (ClienTell), both ways: a
 * splash in the opposite theme's background (dark in light mode, light in dark mode) opens across
 * the window through a fluid band wipe, and about halfway through it the next page opens inside
 * it through the same wipe, until it fills the window; then the browser navigates to it for real.
 *
 * The matte: "fluid abstract shape wipe" (its alpha: a band that opens from a slit and swells to
 * cover the frame), motion-interpolated to 120 fps and traced to vector paths with potrace:
 * /transitions/fluid.json, 65 frames in a 1280×720 space, cover-fitted to the window. Two SVG
 * clipPaths step through the same frames, one for the splash and one, a beat behind, for the
 * page. Vector paths keep the edges crisp at any window size. `rotate` turns the matte 180° (the
 * sandbox's way back).
 *
 * The next page loads ahead of time in a full-window iframe, clipped to nothing, from the hover,
 * focus or touch of a[data-wave]; if it isn't ready within a few seconds of the click, the link
 * just navigates. Reduced motion: plain navigation. A page restored by Back/Forward drops the
 * layers. The two sites allow each other in frame-ancestors.
 *
 * Everything on the page goes under it: the layers share one full-window root at the top z-index,
 * and when the wipe starts that root is shown as a manual popover, which puts it in the browser's
 * top layer, above anything already there (an open modal <dialog> such as a project preview, the
 * media viewer, a fullscreen element), which no z-index can reach. It's only promoted at the
 * click, so it lands above whatever opened before it.
 *
 * Copied from the portfolio (dao-media/portfolio-2lite, src/components/ui/behaviors/waveTransition.ts);
 * keep the two in step.
 */

type Frames = { w: number; h: number; fps: number; frames: string[] };
export type WaveOptions = {
  /** Traced matte frames (/transitions/fluid.json). */
  frames: string;
  /** Each theme's page background; the splash takes the other theme's. */
  background: { light: string; dark: string };
  /** Turn the matte 180°. */
  rotate?: boolean;
  /** Playback speed of each wipe (1 = the source's 0.53 s). */
  rate?: number;
  /** When the page's wipe starts, as a share of the splash's wipe. */
  pageAt?: number;
  timeoutMs?: number;
};

const SVG = 'http://www.w3.org/2000/svg';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const canPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

export function initWaveTransition({ frames: framesUrl, background, rotate = false, rate = 0.6, pageAt = 0.45, timeoutMs = 4000 }: WaveOptions) {
  let framesP: Promise<Frames | null> | null = null;
  const loadFrames = () =>
    (framesP ??= fetch(framesUrl)
      .then((r) => (r.ok ? (r.json() as Promise<Frames>) : null))
      .catch(() => null));

  let root: HTMLDivElement | null = null;
  let svg: SVGSVGElement | null = null;
  let splash: HTMLDivElement | null = null;
  let layer: HTMLDivElement | null = null;
  let paths: SVGPathElement[] = [];
  let frameFor = '';
  let frameReady: Promise<boolean> = Promise.resolve(false);
  let busy = false;

  const teardown = () => {
    root?.remove();
    root = svg = splash = layer = null;
    paths = [];
    frameFor = '';
    busy = false;
  };

  /** A full-window element clipped by a fresh, empty clipPath. */
  function clipped(id: string): HTMLDivElement {
    const clip = document.createElementNS(SVG, 'clipPath');
    clip.id = id;
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('clip-rule', 'evenodd');
    path.setAttribute('d', '');
    clip.appendChild(path);
    svg!.appendChild(clip);
    paths.push(path);
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.inert = true;
    const s = el.style;
    s.position = 'absolute';
    s.inset = '0';
    s.pointerEvents = 'none';
    s.clipPath = `url(#${id})`;
    s.setProperty('-webkit-clip-path', `url(#${id})`);
    return el;
  }

  /** Load `href` in the hidden takeover layers (once per destination). */
  function prepare(href: string) {
    loadFrames();
    if (frameFor === href || busy) return;
    teardown();
    const id = Math.random().toString(36).slice(2, 8);
    svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    // The layers' root: rendered (so the framed page loads and lays out at the window's size) but
    // clipped to nothing until the takeover. It carries `popover` so it can join the top layer;
    // the inline styles keep it drawn before then and undo the popover's own box once it's open.
    root = document.createElement('div');
    root.setAttribute('aria-hidden', 'true');
    root.inert = true;
    if (canPopover) root.popover = 'manual';
    Object.assign(root.style, {
      display: 'block',
      position: 'fixed',
      inset: '0',
      width: 'auto',
      height: 'auto',
      margin: '0',
      padding: '0',
      border: '0',
      overflow: 'hidden',
      background: 'transparent',
      color: 'inherit',
      zIndex: '2147483647',
      pointerEvents: 'none',
    });
    splash = clipped(`wave-splash-${id}`);
    layer = clipped(`wave-page-${id}`);
    const frame = document.createElement('iframe');
    frame.tabIndex = -1;
    frame.title = 'Next page';
    Object.assign(frame.style, { width: '100%', height: '100%', border: '0', display: 'block' });
    frameReady = new Promise((res) => frame.addEventListener('load', () => res(true), { once: true }));
    frame.src = href;
    frameFor = href;
    layer.appendChild(frame);
    // One at a time: the Workers types here narrow append() to two arguments.
    root.appendChild(svg);
    root.appendChild(splash);
    root.appendChild(layer);
    document.body.appendChild(root);
  }

  /** Cover-fit the 16:9 path space to the window (turned 180° if asked). */
  function fit(f: Frames) {
    const w = innerWidth;
    const h = innerHeight;
    const k = Math.max(w / f.w, h / f.h);
    const t = `translate(${(w - f.w * k) / 2} ${(h - f.h * k) / 2}) scale(${k})${rotate ? ` rotate(180 ${f.w / 2} ${f.h / 2})` : ''}`;
    for (const p of paths) p.setAttribute('transform', t);
  }

  async function takeover(href: string) {
    busy = true;
    const timeout = sleep(timeoutMs).then(() => null);
    const f = await Promise.race([loadFrames(), timeout]);
    const ok = f && (await Promise.race([frameReady, timeout]));
    if (!f || !ok || !root || !splash || !layer) {
      location.href = href;
      return;
    }
    const dark = document.documentElement.dataset.theme === 'dark';
    splash.style.background = dark ? background.light : background.dark;
    const page = layer;
    const [splashPath, pagePath] = paths;
    await sleep(120); // let the framed page paint
    // Into the top layer, last in, so above any open dialog or fullscreen element.
    if (canPopover && !root.matches(':popover-open')) {
      try {
        root.showPopover();
      } catch {}
    }
    page.style.pointerEvents = 'auto'; // nothing underneath takes clicks mid-wipe
    fit(f);
    const onResize = () => fit(f);
    addEventListener('resize', onResize);
    const last = f.frames.length - 1;
    const wipe = (last / f.fps / rate) * 1000;
    const total = wipe * (1 + pageAt);
    const at = (k: number) => f.frames[Math.round(Math.min(1, Math.max(0, k)) * last)];
    await new Promise<void>((done) => {
      const t0 = performance.now();
      const step = (now: number) => {
        const t = now - t0;
        splashPath.setAttribute('d', at(t / wipe));
        pagePath.setAttribute('d', t < wipe * pageAt ? '' : at((t - wipe * pageAt) / wipe));
        if (t < total) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    });
    removeEventListener('resize', onResize);
    // Full cover: the framed page is the window. Navigate underneath it.
    page.style.clipPath = 'none';
    page.style.setProperty('-webkit-clip-path', 'none');
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

  // Back/Forward can restore this page mid-takeover: drop the layers.
  addEventListener('pageshow', (e) => {
    if (e.persisted) teardown();
  });
}

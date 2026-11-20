/**
 * Wave line transition between the portfolio and a project's sandbox (ClienTell), both ways.
 *
 * The mask is CGStation's "Line Transition – Wave 09": its alpha channel, split at full cover into
 * two grayscale clips (white = covered): wave-cover.mp4 (0 → 2 s, lines sweep in until the screen
 * is solid) and wave-reveal.mp4 (2 → 4 s, lines sweep out). A WebGL canvas turns that matte into a
 * solid ink panel; a smoothstep on the luma keeps the line edges crisp at any window size, even
 * though the clips are only 1280×720.
 *
 * Leaving: a click on a[data-wave] plays the cover, then navigates (same tab) with ?wave=1.
 * Arriving: a page loaded with ?wave=1 starts solid ink (the inline head script adds
 * html.wave-arrive before first paint), plays the reveal, and drops the parameter from the URL.
 * Back/forward from the bfcache drops the panel. Reduced motion: plain navigation, no panel.
 *
 * Copied from the portfolio (dao-media/portfolio-2lite, src/components/ui/behaviors/waveTransition.ts);
 * keep the two in step.
 */

export type WaveOptions = { cover: string; reveal: string; color?: string; rate?: number };

const PARAM = 'wave';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const VERT = `attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}`;
// cover-fit the 16:9 matte to the window; alpha = matte luma, sharpened.
const FRAG = `precision mediump float;varying vec2 uv;uniform sampler2D t;uniform vec3 c;uniform vec2 s;
void main(){vec2 q=(uv-.5)*s+.5;float m=texture2D(t,q).r;float a=smoothstep(.38,.62,m);gl_FragColor=vec4(c*a,a);}`;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

class Panel {
  canvas = document.createElement('canvas');
  private gl: WebGLRenderingContext;
  private tex: WebGLTexture;
  private scale: WebGLUniformLocation;
  private raf = 0;

  constructor(color: string) {
    const cv = this.canvas;
    cv.setAttribute('aria-hidden', 'true');
    Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', zIndex: '2147483647', pointerEvents: 'none' });
    const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) throw new Error('no webgl');
    this.gl = gl;
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    gl.uniform3fv(gl.getUniformLocation(prog, 'c'), hexToRgb(color));
    this.scale = gl.getUniformLocation(prog, 's')!;
    document.body.appendChild(cv);
    this.resize();
  }

  private resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = innerWidth, h = innerHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // cover: crop the 16:9 matte to the window's aspect
    const a = w / h, m = 16 / 9;
    this.gl.uniform2f(this.scale, a < m ? a / m : 1, a < m ? 1 : m / a);
  }

  draw(video: HTMLVideoElement) {
    const gl = this.gl;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, video);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Play the clip through the panel; resolves when it ends (or fails). */
  play(video: HTMLVideoElement, rate: number): Promise<void> {
    return new Promise((done) => {
      const tick = () => { if (video.readyState >= 2) this.draw(video); this.raf = requestAnimationFrame(tick); };
      const finish = () => { cancelAnimationFrame(this.raf); if (video.readyState >= 2) this.draw(video); done(); };
      video.addEventListener('ended', finish, { once: true });
      video.addEventListener('error', finish, { once: true });
      video.playbackRate = rate;
      tick();
      video.play().catch(finish);
    });
  }

  remove() { cancelAnimationFrame(this.raf); this.canvas.remove(); }
}

function clip(src: string, preload: 'auto' | 'none' = 'auto') {
  const v = document.createElement('video');
  v.crossOrigin = 'anonymous';
  v.muted = true;
  v.playsInline = true;
  v.preload = preload;
  v.src = src;
  return v;
}

/** Resolves once the clip can play (or after `ms`, so a slow network never strands the page). */
const ready = (v: HTMLVideoElement, ms: number) =>
  new Promise<boolean>((res) => {
    if (v.readyState >= 3) return res(true);
    const t = setTimeout(() => res(false), ms);
    v.addEventListener('canplay', () => { clearTimeout(t); res(true); }, { once: true });
    v.addEventListener('error', () => { clearTimeout(t); res(false); }, { once: true });
    v.load();
  });

export function withWave(href: string): string {
  // (Also runs during server rendering, where there's no location: href is absolute there.)
  const u = new URL(href, typeof location === 'undefined' ? undefined : location.href);
  u.searchParams.set(PARAM, '1');
  return u.href;
}

export function initWaveTransition({ cover, reveal, color = '#241e1c', rate = 1.5 }: WaveOptions) {
  const root = document.documentElement;
  const unveil = () => root.classList.remove('wave-arrive');

  // Arriving: reveal, then tidy the URL.
  const url = new URL(location.href);
  if (url.searchParams.has(PARAM)) {
    url.searchParams.delete(PARAM);
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    if (reduced()) unveil();
    else {
      let panel: Panel | null = null;
      try { panel = new Panel(color); } catch { unveil(); }
      if (panel) {
        const v = clip(reveal);
        ready(v, 4000).then(async (ok) => {
          if (ok) { panel!.draw(v); unveil(); await panel!.play(v, rate); }
          else unveil();
          panel!.remove();
        });
      }
    }
  }

  // Back/forward restores the page as it was left: mid-cover. Drop the panel.
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    unveil();
    document.querySelectorAll('canvas[data-wave-panel]').forEach((c) => c.remove());
  });

  // Leaving.
  let coverClip: HTMLVideoElement | null = null;
  const warm = () => { coverClip ??= clip(cover); };
  document.addEventListener('pointerover', (e) => { if ((e.target as Element).closest?.('a[data-wave]')) warm(); }, { passive: true });
  document.addEventListener('focusin', (e) => { if ((e.target as Element).closest?.('a[data-wave]')) warm(); });

  document.addEventListener('click', async (e) => {
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[data-wave]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const dest = withWave(a.href);
    if (reduced()) return; // plain link, plain navigation
    e.preventDefault();
    let panel: Panel;
    try { panel = new Panel(color); } catch { location.href = a.href; return; }
    panel.canvas.dataset.wavePanel = '';
    warm();
    const ok = await ready(coverClip!, 1500);
    if (ok) await panel.play(coverClip!, rate);
    location.href = ok ? dest : a.href;
  });
}

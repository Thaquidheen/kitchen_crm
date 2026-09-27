/**
 * KitchenBuildPanel
 * ---------------------------------------------------------------------------
 * A scroll-driven "build-up" panel: as the user scrolls the dashboard's main
 * content area, a kitchen assembles itself from a 2D technical drawing into a
 * finished, styled kitchen. Scrolling back up reverses it.
 *
 * HOW IT FITS THE DASHBOARD
 *   The dashboard's `<main>` element scrolls on its own (overflow-y: auto) —
 *   the window does not. So ScrollTrigger is given `scroller: <main>`, and the
 *   panel's height is MEASURED from that element rather than taken from 100vh:
 *   the topbar occupies its own row in the flex column, so the viewport height
 *   and the scroller height are not the same number.
 *
 *   A wrapper around the sticky panel supplies the scroll length
 *   (CONFIG.scrollLength x the scroller's visible height). The panel itself is
 *   `position: sticky`, so nothing is pinned by GSAP and the widgets below are
 *   never displaced — no layout shift.
 *
 * PACING
 *   The source render is not evenly paced — stage 1 is nearly static and stage 5
 *   is dense. A single linear frame map would rush the interesting parts, so the
 *   timeline is built from five tweens of EQUAL duration, one per stage, each
 *   easing "none" across that stage's own frame range. Every stage therefore
 *   gets the same amount of scroll regardless of how many frames it spans.
 *
 * SMOOTHNESS
 *   The scrubbed frame value is fractional (57.4). We draw frame 57, then frame
 *   58 on top at globalAlpha 0.4, which blends the two into something that reads
 *   as video rather than as a flipbook.
 */

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './KitchenBuildPanel.css';

gsap.registerPlugin(ScrollTrigger);

/* ========================================================================== *
 * CONFIG — everything tunable lives here.
 * ========================================================================== */

const CONFIG = {
  /**
   * The element that actually scrolls. In this dashboard that is the `<main>`
   * in AppLayout (see AppLayout.tsx, which carries id="dashboard-main").
   * Set to `window` if you ever move the panel onto a page where the whole
   * document scrolls.
   */
  scroller: '#dashboard-main' as string | Window,

  /**
   * Gap between the top of the scroll container and the stuck panel, in px.
   *
   * 0 is correct for THIS dashboard: the topbar is a flex sibling *above*
   * `<main>`, so the scroll container already begins below it — they never
   * overlap. Raise this only if you make the topbar overlay the content
   * (position: fixed / sticky over it), in which case use the topbar height.
   */
  topOffset: 0,

  /** Scroll length as a multiple of the scroller's visible height. */
  scrollLength: 5.5,

  frameCount: 242,
  desktopPath: (i: number) => `/frames/desktop/frame-${String(i).padStart(3, '0')}.webp`,
  mobilePath: (i: number) => `/frames/mobile/frame-${String(i).padStart(3, '0')}.webp`,

  /** Inclusive frame range per stage. Adjacent stages deliberately share a frame. */
  stages: [
    [1, 34],
    [34, 82],
    [82, 130],
    [130, 178],
    [178, 242],
  ] as [number, number][],

  /** Extra timeline time holding on the final frame, in stage units. */
  holdDuration: 0.4,

  /** ScrollTrigger scrub smoothing, in seconds. */
  scrub: 0.6,

  /** Attach Lenis to the dashboard's content element for smooth wheel scrolling. */
  smoothScroll: true,

  /**
   * When true, a completed watch is remembered in localStorage and LATER VISITS
   * GET THE SHORT CARD instead of the scroll animation.
   *
   * Off: the full build plays on every visit, for everyone. Turning this on is
   * what made the dashboard show the small "Watch the build" card to returning
   * users — the flag, not a bug. (Re-enabling it also re-reads any existing
   * `kbp:seen:v1` key, so clear that to test a "first visit".)
   */
  rememberSeen: false,

  /** Panel width (px) below which the 960x540 frame set is used. */
  mobileBreakpoint: 768,

  /** Parallel frame fetches. */
  concurrency: 6,

  storageKey: 'kbp:seen:v1',
} as const;

/** Copy for each stage. */
const STAGE_TEXT = [
  { step: '01', title: 'It starts with a plan', body: 'Every centimetre measured for your space.' },
  { step: '02', title: 'Built to measure', body: 'Base units and a solid walnut worktop, made to fit.' },
  { step: '03', title: 'Storage, floor to ceiling', body: 'Tall units and wall cabinets that use every inch.' },
  { step: '04', title: 'Light and texture', body: 'Warm LED strips and a fluted walnut feature wall.' },
  { step: '05', title: 'Ready to cook', body: 'Your kitchen, finished and styled.' },
];

const FIRST_FRAME = CONFIG.stages[0][0];
const LAST_FRAME = CONFIG.stages[CONFIG.stages.length - 1][1];
const CARD_BG = '#F3EEE7';

/* ========================================================================== *
 * Small helpers
 * ========================================================================== */

type Drawable = ImageBitmap | HTMLImageElement;

const clampFrame = (i: number) => Math.min(LAST_FRAME, Math.max(FIRST_FRAME, Math.round(i)));

const readSeen = (): boolean => {
  if (!CONFIG.rememberSeen) return false;
  try {
    return window.localStorage.getItem(CONFIG.storageKey) === '1';
  } catch {
    // Private mode / blocked storage: just behave like a first visit.
    return false;
  }
};

const writeSeen = () => {
  if (!CONFIG.rememberSeen) return;
  try {
    window.localStorage.setItem(CONFIG.storageKey, '1');
  } catch {
    /* ignore */
  }
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** requestIdleCallback with a setTimeout fallback (Safari). */
const onIdle = (fn: () => void): (() => void) => {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(fn, { timeout: 1200 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, 200);
  return () => window.clearTimeout(id);
};

/* ========================================================================== *
 * FrameLoader
 * --------------------------------------------------------------------------
 * Owns every decoded frame and the network work behind them. Deliberately a
 * plain class rather than React state: frames change ~60x/second while
 * scrolling, and none of that should re-render the component tree.
 * ========================================================================== */

class FrameLoader {
  /** 1-indexed; index 0 is unused. */
  private frames: (Drawable | null)[] = new Array(CONFIG.frameCount + 1).fill(null);
  private objectUrls: string[] = [];
  private abort = new AbortController();
  private destroyed = false;

  loaded = 0;

  // Written out longhand rather than as a constructor parameter property:
  // this tsconfig sets `erasableSyntaxOnly`, which bans those.
  private path: (i: number) => string;

  constructor(path: (i: number) => string) {
    this.path = path;
  }

  get total() {
    return CONFIG.frameCount;
  }

  /**
   * The nearest frame that is actually decoded. While the set is still
   * streaming in, this is what keeps the canvas showing *something* sensible
   * instead of going blank mid-scroll.
   */
  nearest(i: number): Drawable | null {
    const target = clampFrame(i);
    if (this.frames[target]) return this.frames[target];
    for (let d = 1; d <= CONFIG.frameCount; d++) {
      const lo = target - d;
      if (lo >= FIRST_FRAME && this.frames[lo]) return this.frames[lo];
      const hi = target + d;
      if (hi <= LAST_FRAME && this.frames[hi]) return this.frames[hi];
    }
    return null;
  }

  async loadOne(i: number): Promise<void> {
    if (this.destroyed || this.frames[i]) return;
    const res = await fetch(this.path(i), { signal: this.abort.signal, cache: 'force-cache' });
    if (!res.ok) throw new Error(`frame ${i}: HTTP ${res.status}`);
    const blob = await res.blob();
    if (this.destroyed) return;

    // createImageBitmap decodes off the main thread, which is what keeps the
    // scroll at 60fps while later stages are still arriving.
    if (typeof createImageBitmap === 'function') {
      const bmp = await createImageBitmap(blob);
      if (this.destroyed) {
        bmp.close();
        return;
      }
      this.frames[i] = bmp;
    } else {
      const url = URL.createObjectURL(blob);
      this.objectUrls.push(url);
      const img = new Image();
      img.src = url;
      await (img.decode ? img.decode() : Promise.resolve());
      if (this.destroyed) return;
      this.frames[i] = img;
    }
    this.loaded++;
  }

  /**
   * Fetch `order` with a small concurrency pool. Order is stage order, so the
   * frames the user reaches first are the frames that arrive first.
   */
  async loadAll(order: number[], onProgress: (loaded: number, total: number) => void) {
    let cursor = 0;
    const worker = async () => {
      while (!this.destroyed) {
        const idx = cursor++;
        if (idx >= order.length) return;
        try {
          await this.loadOne(order[idx]);
          onProgress(this.loaded, this.total);
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
          // A single missing frame must not stall the build — nearest() covers it.
        }
      }
    };
    await Promise.all(Array.from({ length: CONFIG.concurrency }, worker));
  }

  destroy() {
    this.destroyed = true;
    this.abort.abort();
    for (const f of this.frames) {
      if (f && typeof (f as ImageBitmap).close === 'function') (f as ImageBitmap).close();
    }
    this.frames = [];
    for (const u of this.objectUrls) URL.revokeObjectURL(u);
    this.objectUrls = [];
  }
}

/* ========================================================================== *
 * Component
 * ========================================================================== */

export interface KitchenBuildPanelProps {
  /** Scroll container: an element, a selector, or omitted to use CONFIG.scroller. */
  scroller?: Element | string | null;
  /** Fired once, the first time the build reaches the final frame. */
  onComplete?: () => void;
  /** Extra class on the outermost element. */
  className?: string;
}

export function KitchenBuildPanel({ scroller, onComplete, className }: KitchenBuildPanelProps) {
  // Decided once, synchronously, so the very first paint is already the right
  // variant — no flash of the full panel before collapsing to the compact card.
  const [reduced] = useState(prefersReducedMotion);
  // Read once, at mount. Deliberately NOT updated when the build completes:
  // flipping it mid-watch would swap the panel out for the compact card while
  // the user is still looking at the finished kitchen. The compact decision
  // belongs to the *next* visit.
  const [seen] = useState(readSeen);
  const [expanded, setExpanded] = useState(false);

  const showFull = !reduced && (!seen || expanded);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const scrollBtnRef = useRef<HTMLButtonElement | null>(null);
  /** Filled in by the effect once ScrollTrigger knows its start/end. */
  const advanceRef = useRef<() => void>(() => {});
  const progressRef = useRef<HTMLDivElement | null>(null);

  // Kept in a ref so changing the callback never tears down the timeline.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const markSeen = useCallback(() => {
    writeSeen();
  }, []);

  /* ---------------------------------------------------------------------- *
   * The whole animation. One effect, one teardown.
   *
   * useLayoutEffect (not useEffect) so the wrapper's height is written before
   * the browser paints: measuring in a passive effect would let the widgets
   * below render at the wrong offset for one frame.
   * ---------------------------------------------------------------------- */
  useLayoutEffect(() => {
    if (!showFull) return;

    const wrap = wrapRef.current;
    const panel = panelRef.current;
    const stage = stageRef.current;
    const card = cardRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !panel || !stage || !card || !canvas) return;

    /* ---- resolve the scroll container ---- */
    const resolve = (s: Element | string | Window | null | undefined): HTMLElement | null => {
      if (!s) return null;
      if (s === window) return null;
      if (typeof s === 'string') return document.querySelector<HTMLElement>(s);
      return s as HTMLElement;
    };
    // Prop wins over CONFIG; if neither resolves, fall back to the nearest
    // scrollable ancestor so the panel still works if it is moved elsewhere.
    const scrollerEl =
      resolve(scroller) ??
      resolve(CONFIG.scroller) ??
      (panel.closest('main, [data-scroll-container]') as HTMLElement | null);

    if (!scrollerEl) {
      // Nothing to attach to. Leave frame 1 on screen rather than throwing.
      return;
    }
    // Lenis needs a single content element; `<main>`'s padded child is it.
    const contentEl = (scrollerEl.firstElementChild as HTMLElement) ?? scrollerEl;

    const ctx2d = canvas.getContext('2d', { alpha: false });
    if (!ctx2d) return;

    let destroyed = false;

    /* ================= frame loading ================= */

    let loader: FrameLoader | null = null;
    let variant: 'desktop' | 'mobile' | null = null;
    let bulkStarted = false;
    let cancelIdle: (() => void) | null = null;

    const pickVariant = (): 'desktop' | 'mobile' =>
      panel.clientWidth < CONFIG.mobileBreakpoint ? 'mobile' : 'desktop';

    /** Stage order: the frames the user meets first are fetched first. */
    const stageOrder = (): number[] => {
      const seenSet = new Set<number>();
      const order: number[] = [];
      for (const [from, to] of CONFIG.stages) {
        for (let i = from; i <= to; i++) {
          if (!seenSet.has(i)) {
            seenSet.add(i);
            order.push(i);
          }
        }
      }
      return order;
    };

    const setPill = (loaded: number, total: number) => {
      const pill = pillRef.current;
      if (!pill) return;
      if (loaded >= total) {
        pill.style.display = 'none';
        return;
      }
      pill.style.display = '';
      const pct = Math.round((loaded / total) * 100);
      const label = pill.querySelector('[data-pill-label]');
      if (label) label.textContent = `Preparing your kitchen… ${pct}%`;
    };

    const startBulkLoad = () => {
      if (bulkStarted || destroyed || !loader) return;
      bulkStarted = true;
      const active = loader;
      // After first paint, and only while idle, so the dashboard's own data and
      // widgets get the main thread first.
      cancelIdle = onIdle(() => {
        if (destroyed || active !== loader) return;
        void active.loadAll(stageOrder(), (l, t) => {
          if (!destroyed && active === loader) {
            setPill(l, t);
            needsRedraw = true;
          }
        });
      });
    };

    /** Build (or rebuild, after a desktop/mobile switch) the frame store. */
    const buildLoader = (next: 'desktop' | 'mobile') => {
      variant = next;
      bulkStarted = false;
      cancelIdle?.();
      cancelIdle = null;
      loader?.destroy();
      loader = new FrameLoader(next === 'mobile' ? CONFIG.mobilePath : CONFIG.desktopPath);
      const active = loader;
      setPill(0, active.total);
      // Frame 1 first and on its own, so the panel is never empty.
      active
        .loadOne(FIRST_FRAME)
        .then(() => {
          if (destroyed || active !== loader) return;
          needsRedraw = true;
          setPill(active.loaded, active.total);
          if (visible) startBulkLoad();
        })
        .catch(() => {
          /* handled by nearest() */
        });
    };

    /* ================= canvas sizing & drawing ================= */

    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let needsResize = true;
    let needsRedraw = true;
    let lastDrawn = -1;
    let settledTicks = 0;
    let crispDrawn = false;

    /**
     * Fit the image card to the largest 16:9 box the stage area can hold, then
     * size the canvas backing store to match.
     *
     * Measuring the STAGE (not the card) and writing the card's px size is what
     * makes this correct at every screen size. A 1920x1080 or 1366x768 laptop
     * gives a canvas column that is far wider than it is tall, and pure CSS
     * (width:100% + aspect-ratio + max-height) resolves that by clamping the
     * height while keeping the full width — which silently breaks the ratio.
     */
    const sizeCanvas = () => {
      const s = stage.getBoundingClientRect();
      if (!s.width || !s.height) return;

      const boxW = Math.min(s.width, s.height * (16 / 9));
      const boxH = boxW * (9 / 16);
      const wPx = `${Math.round(boxW)}px`;
      const hPx = `${Math.round(boxH)}px`;
      if (card.style.width !== wPx) card.style.width = wPx;
      if (card.style.height !== hPx) card.style.height = hPx;

      dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2
      cssW = Math.round(boxW);
      cssH = Math.round(boxH);
      const w = Math.round(cssW * dpr);
      const h = Math.round(cssH * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    /** "contain" fit — never crop, so the edge dimension lines stay visible. */
    const drawContain = (img: Drawable, alpha: number) => {
      const iw = (img as ImageBitmap).width;
      const ih = (img as ImageBitmap).height;
      if (!iw || !ih) return;
      const scale = Math.min(cssW / iw, cssH / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      // The frames are 1920x1080, so a full-width canvas on a large or HiDPI
      // display scales them UP. Canvas defaults to 'low' smoothing, which makes
      // that upscale visibly blocky; 'high' costs nothing at this frame rate.
      ctx2d.imageSmoothingEnabled = true;
      ctx2d.imageSmoothingQuality = 'high';
      ctx2d.globalAlpha = alpha;
      ctx2d.drawImage(img, (cssW - dw) / 2, (cssH - dh) / 2, dw, dh);
      ctx2d.globalAlpha = 1;
    };

    /**
     * `blend` cross-fades the two neighbouring frames, which is what makes the
     * scroll read as video rather than a flipbook. At REST it is turned off and a
     * single whole frame is drawn instead: a 60/40 blend of two frames is
     * inherently soft, and the still image is what the user actually looks at.
     */
    const draw = (frameValue: number, blend: boolean) => {
      if (!loader || !cssW || !cssH) return;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.fillStyle = CARD_BG;
      ctx2d.fillRect(0, 0, cssW, cssH);

      if (!blend) {
        const only = loader.nearest(Math.round(frameValue));
        if (only) drawContain(only, 1);
        return;
      }

      const lo = Math.floor(frameValue);
      const t = frameValue - lo;
      const a = loader.nearest(lo);
      if (a) drawContain(a, 1);
      // Sub-frame blend: the fractional part is the opacity of the next frame.
      if (t > 0.01 && lo + 1 <= LAST_FRAME) {
        const b = loader.nearest(lo + 1);
        if (b && b !== a) drawContain(b, t);
      }
    };

    /* ================= measuring ================= */

    /**
     * Panel height comes from the scroll container, never from 100vh — the
     * topbar has already taken its share by the time we get here.
     * Writes are guarded so a ResizeObserver can call this without looping.
     */
    const measure = () => {
      const h = Math.max(320, scrollerEl.clientHeight - CONFIG.topOffset);
      const panelH = `${h}px`;
      const wrapH = `${Math.round(h * CONFIG.scrollLength)}px`;
      const top = `${CONFIG.topOffset}px`;
      if (panel.style.height !== panelH) panel.style.height = panelH;
      if (panel.style.top !== top) panel.style.top = top;
      if (wrap.style.height !== wrapH) wrap.style.height = wrapH;
    };

    measure();
    sizeCanvas();

    /* ================= smooth scrolling =================
     * Created BEFORE the timeline: the rAF loop below drives lenis.raf(), and
     * the control handlers scroll through it.
     */
    let rafId = 0;
    let lenis: Lenis | null = null;

    if (CONFIG.smoothScroll) {
      lenis = new Lenis({
        wrapper: scrollerEl,
        content: contentEl,
        autoRaf: false, // driven from our own rAF loop below
        duration: 0.9,
      });
      // Keep ScrollTrigger in step with Lenis' virtual position.
      lenis.on('scroll', ScrollTrigger.update);
    }

    /* ================= timeline ================= */

    const proxy = { frame: FIRST_FRAME };

    const gsapCtx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

      CONFIG.stages.forEach(([from, to], i) => {
        // Five tweens, all duration 1: every stage gets the same scroll budget
        // no matter how many frames it actually spans.
        tl.fromTo(
          proxy,
          { frame: from },
          { frame: to, duration: 1, ease: 'none', immediateRender: i === 0 },
          i
        );
      });

      // Hold on the finished kitchen.
      tl.to(proxy, { frame: LAST_FRAME, duration: CONFIG.holdDuration }, CONFIG.stages.length);

      const st = ScrollTrigger.create({
        trigger: wrap,
        scroller: scrollerEl,
        start: 'top top',
        end: 'bottom bottom',
        scrub: CONFIG.scrub,
        animation: tl,
        invalidateOnRefresh: true,
      });

      /* ---- the scroll button ----
       * Clicking advances one stage; once the kitchen is finished it scrolls
       * past the panel to the dashboard widgets instead.
       *
       * The target is measured from the DOM rather than read off ScrollTrigger's
       * `st.start`/`st.end`. Those are not dependably populated on the instance
       * this closure captures -- `st.end` came back `undefined`, which made the
       * target NaN and `lenis.scrollTo(NaN)` silently do nothing. The wrapper's
       * own geometry is the same information and is always correct.
       */
      const totalDur = tl.duration();

      const scrollToY = (y: number) => {
        if (!Number.isFinite(y)) return;
        if (lenis) {
          // Cheap insurance on a click: Lenis clamps scrollTo() to its cached
          // `limit`, and the widgets below can change the content height after
          // Lenis was constructed.
          lenis.resize();
          lenis.scrollTo(y, { duration: 0.9 });
        } else {
          scrollerEl.scrollTo({ top: y, behavior: 'smooth' });
        }
      };

      /** Scroll offset at which the build starts, and its total travel. */
      const geometry = () => {
        const top =
          scrollerEl.scrollTop + wrap.getBoundingClientRect().top - scrollerEl.getBoundingClientRect().top;
        return { top, travel: Math.max(1, wrap.offsetHeight - scrollerEl.clientHeight) };
      };

      advanceRef.current = () => {
        const { top, travel } = geometry();
        const fraction = Math.min(1, Math.max(0, (scrollerEl.scrollTop - top) / travel));

        // Finished: leave the panel and land on the widgets below.
        if (fraction > 0.985) {
          scrollToY(top + wrap.offsetHeight - scrollerEl.clientHeight + scrollerEl.clientHeight);
          return;
        }

        // Land a little way INTO the next stage, so the frame has visibly moved on.
        const nextTime = Math.min(totalDur, Math.floor(fraction * totalDur + 1e-3) + 1 + 0.16);
        scrollToY(top + (nextTime / totalDur) * travel);
      };

      /* ---- per-frame chrome updates ----
       * Written straight to the DOM rather than through React state: this runs
       * on every animation frame while scrolling, and re-rendering the panel
       * (and the dashboard around it) at that rate would cost the 60fps.
       */
      let lastStage = -1;
      let completed = false;

      const updateChrome = () => {
        const p = tl.progress();
        const time = tl.time();

        const fill = progressRef.current;
        if (fill) fill.style.transform = `scaleX(${p})`;

        // The visible copy is gone, but the stage still has to reach screen
        // readers -- otherwise the canvas is just an unlabelled image that
        // silently changes for five screens of scrolling.
        const stage = Math.min(CONFIG.stages.length - 1, Math.floor(time + 1e-3));
        if (stage !== lastStage) {
          lastStage = stage;
          const t = STAGE_TEXT[stage];
          canvas.setAttribute('aria-label', `Stage ${stage + 1} of ${CONFIG.stages.length}: ${t.title}. ${t.body}`);
        }

        const btn = scrollBtnRef.current;
        if (btn) {
          const done = p > 0.985;
          if (btn.dataset.done !== String(done)) {
            btn.dataset.done = String(done);
            btn.setAttribute('aria-label', done ? 'Continue to the dashboard' : 'Scroll to the next stage');
          }
        }

        if (!completed && p > 0.995) {
          completed = true;
          markSeen();
          onCompleteRef.current?.();
        }
      };

      /* ---- single rAF loop: Lenis, resize, draw, chrome ---- */
      const tick = (time: number) => {
        rafId = requestAnimationFrame(tick);
        lenis?.raf(time);

        if (needsResize) {
          needsResize = false;
          sizeCanvas();
          needsRedraw = true;
        }
        const f = proxy.frame;
        // Redraw only when the frame value actually moved.
        if (needsRedraw || Math.abs(f - lastDrawn) > 0.001) {
          draw(f, true);
          lastDrawn = f;
          needsRedraw = false;
          settledTicks = 0;
          crispDrawn = false;
        } else if (!crispDrawn && ++settledTicks >= 2) {
          // Scroll has stopped. Repaint the nearest whole frame un-blended so the
          // image the user is left looking at is as sharp as the source allows.
          draw(f, false);
          crispDrawn = true;
        }
        updateChrome();
      };
      rafId = requestAnimationFrame(tick);
    }, panel);

    /* ================= observers & refresh ================= */

    let refreshTimer = 0;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        if (destroyed) return;
        measure();
        needsResize = true;
        lenis?.resize();
        ScrollTrigger.refresh();
      }, 120);
    };

    // The scroller resizing covers BOTH the window resizing and the sidebar
    // collapsing/expanding — the sidebar changes this element's width without
    // any window event at all.
    const scrollerRO = new ResizeObserver(() => {
      scheduleRefresh();
      // The sidebar animates over 200ms; refresh again once it has settled.
      window.setTimeout(() => {
        if (destroyed) return;
        measure();
        lenis?.resize();
        ScrollTrigger.refresh();
      }, 260);
    });
    scrollerRO.observe(scrollerEl);

    // Widgets below finishing their data fetches changes the content height,
    // which moves our end position.
    const contentRO = new ResizeObserver(() => scheduleRefresh());
    contentRO.observe(contentEl);

    // The STAGE area drives the card box and the canvas backing store. Observing
    // the card instead would feed back on itself, since sizeCanvas() writes the
    // card's width/height.
    const stageRO = new ResizeObserver(() => {
      needsResize = true;
      // Crossing 768px means a different frame set.
      const next = pickVariant();
      if (next !== variant) buildLoader(next);
    });
    stageRO.observe(stage);

    const onWindowResize = () => scheduleRefresh();
    window.addEventListener('resize', onWindowResize);

    /* ---- defer bulk loading until the panel is actually on screen ---- */
    let visible = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            visible = true;
            startBulkLoad();
          }
        }
      },
      { root: scrollerEl, rootMargin: '200px' }
    );
    io.observe(panel);

    /* ---- hide the scroll hint after the first scroll ---- */
    const onFirstScroll = () => {
      hintRef.current?.setAttribute('data-hidden', 'true');
      scrollerEl.removeEventListener('scroll', onFirstScroll);
    };
    scrollerEl.addEventListener('scroll', onFirstScroll, { passive: true });

    /* ---- kick off ---- */
    buildLoader(pickVariant());

    /* ================= teardown =================
     * Everything created above is undone here. This runs on unmount (route
     * change) AND on StrictMode's second pass in development, so it has to be
     * complete: a leaked ScrollTrigger would double-scrub the timeline.
     */
    return () => {
      destroyed = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(refreshTimer);
      window.removeEventListener('resize', onWindowResize);
      scrollerEl.removeEventListener('scroll', onFirstScroll);
      io.disconnect();
      scrollerRO.disconnect();
      contentRO.disconnect();
      stageRO.disconnect();
      cancelIdle?.();
      lenis?.destroy();
      lenis = null;
      // Reverts every tween AND every ScrollTrigger created inside the context.
      gsapCtx.revert();
      loader?.destroy();
      loader = null;
      advanceRef.current = () => {};
    };
  }, [showFull, scroller, markSeen]);

  /* ====================================================================== *
   * Reduced motion — no animation at all: the two end states side by side
   * plus the stage copy as a plain list.
   * ====================================================================== */
  if (reduced) {
    return (
      <div className={`kbp-root kbp-cq ${className ?? ''}`}>
        <div className="kbp-static">
          <div className="kbp-static-pair">
            <figure>
              <img src={CONFIG.desktopPath(FIRST_FRAME)} alt="Technical drawing of the kitchen with measurements" />
              <figcaption>Plan</figcaption>
            </figure>
            <div className="kbp-static-arrow" aria-hidden="true">
              →
            </div>
            <figure>
              <img src={CONFIG.desktopPath(LAST_FRAME)} alt="The finished, styled kitchen" />
              <figcaption>Finished</figcaption>
            </figure>
          </div>
          <ol className="kbp-static-list">
            {STAGE_TEXT.map((s) => (
              <li key={s.step}>
                <span className="kbp-step">{s.step}</span>
                <span>
                  <strong className="kbp-title" style={{ fontSize: 15, display: 'block' }}>
                    {s.title}
                  </strong>
                  <span className="kbp-body">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  /* ====================================================================== *
   * Compact mode — returning visitors are not made to scroll it again.
   * ====================================================================== */
  if (!showFull) {
    return (
      <div className={`kbp-root kbp-cq ${className ?? ''}`}>
        <div className="kbp-compact">
          <div className="kbp-compact-thumb">
            <img src={CONFIG.desktopPath(LAST_FRAME)} alt="The finished, styled kitchen" loading="lazy" />
          </div>
          <div className="kbp-compact-copy">
            <span className="kbp-step">YOUR KITCHEN</span>
            <h3 className="kbp-title" style={{ fontSize: 17 }}>
              From plan to finished kitchen
            </h3>
            <p className="kbp-body" style={{ marginBottom: 12 }}>
              Five stages, measured and built to fit.
            </p>
            <button type="button" className="kbp-btn kbp-btn-primary" onClick={() => setExpanded(true)}>
              Watch the build
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ====================================================================== *
   * Full scroll-driven panel
   * ====================================================================== */
  return (
    <div className={`kbp-root kbp-wrap ${className ?? ''}`} ref={wrapRef}>
      <section className="kbp-panel" ref={panelRef} aria-label="How your kitchen is built">
        {/* Progress along the top edge */}
        <div className="kbp-progress" aria-hidden="true">
          <div className="kbp-progress-fill" ref={progressRef} />
        </div>

        <div className="kbp-grid">
          {/* The kitchen canvas is now the panel's only content, edge to edge. */}
          <div className="kbp-stage" ref={stageRef}>
            <div className="kbp-card" ref={cardRef}>
              <canvas
                className="kbp-canvas"
                ref={canvasRef}
                role="img"
                aria-label="The kitchen assembling itself, from technical drawing to finished room"
              />
              <div className="kbp-pill" ref={pillRef}>
                <span className="kbp-pill-dot" aria-hidden="true" />
                <span data-pill-label>Preparing your kitchen… 0%</span>
              </div>
              <div className="kbp-hint" ref={hintRef} data-hidden="false">
                <span className="kbp-mouse" aria-hidden="true" />
                Scroll to build
              </div>
              <button
                type="button"
                className="kbp-scroll-btn"
                ref={scrollBtnRef}
                data-done="false"
                aria-label="Scroll to the next stage"
                onClick={() => advanceRef.current()}
              >
                <ChevronDown size={20} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default KitchenBuildPanel;

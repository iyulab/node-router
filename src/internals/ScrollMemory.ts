import type { RouteNavigation } from '../types/RouteContext.js';

/** 기록 항목의 스크롤 위치 — `history.state.scroll` 에도 같은 모양으로 남는다(새로 고침 뒤 복원). */
export interface ScrollPosition {
  x: number;
  y: number;
}

/** 늦게 서는 화면(데이터를 받은 뒤 높이가 생기는)을 얼마나 기다리는가. */
const RESTORE_WAIT_MS = 1_500;

/** 사람이 먼저 굴리면 복원을 멈춘다 — 사람의 손이 이긴다. */
const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

/**
 * 기록 항목마다 스크롤 위치를 기억하고, 그 항목에 돌아오면 화면이 선 뒤 되돌린다(`RouterConfig.scrollRestoration`).
 *
 * 브라우저의 기본 복원(`history.scrollRestoration = 'auto'`)은 문서 스크롤만, 그것도 문서가 바뀌는 순간에 한다 — 안쪽 상자가
 * 스크롤하는 셸에는 닿지 않고, 비동기로 그려지는 화면에서는 내용이 서기 전에 위치를 잘라 버린다. 이동의 종류와 렌더 완료를
 * 아는 쪽이 라우터라 여기서 한다.
 */
export class ScrollMemory {
  private readonly positions = new Map<string, ScrollPosition>();
  private readonly previousRestoration: ScrollRestoration;
  private cancelRestore?: () => void;

  constructor(
    private readonly container: () => Element | null | undefined,
    /** 지금 그려진 기록 항목의 키 — 새로 고침 직전에 그 위치를 항목 상태에 적는다. */
    private readonly currentEntryKey: () => string | undefined,
  ) {
    this.previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.addEventListener('pagehide', this.persist);
  }

  destroy(): void {
    this.cancelRestore?.();
    window.removeEventListener('pagehide', this.persist);
    window.history.scrollRestoration = this.previousRestoration;
  }

  /** 스크롤하는 상자 — 주어진 것이 없으면(아직 그려지지 않은 셸) 문서. */
  private target(): Element {
    return this.container() ?? document.scrollingElement ?? document.documentElement;
  }

  /**
   * 떠나는 항목의 위치를 기억한다. `writeToEntry` 면 그 항목이 아직 현재라(새 항목을 쌓기 직전) `history.state` 에도 적는다 —
   * 뒤로 가기로 돌아오면 이 문서의 기억에서, 새로 고침·다른 문서에서 돌아오면 항목 상태에서 읽는다.
   */
  remember(entryKey: string | undefined, writeToEntry: boolean): void {
    this.cancelRestore?.();
    if (!entryKey) return;
    const el = this.target();
    const position = { x: el.scrollLeft, y: el.scrollTop };
    this.positions.set(entryKey, position);
    if (writeToEntry) this.writeToCurrentEntry(position);
  }

  /** 화면이 선 뒤 — 이동 종류대로 위치를 정한다. */
  arrive(navigation: RouteNavigation, hash: string | undefined): void {
    const el = this.target();
    if (navigation.type === 'push') {
      const anchor = hash && hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      if (anchor) anchor.scrollIntoView();
      else el.scrollTo(0, 0);
      return;
    }
    if (navigation.type === 'replace') return;
    const saved = this.positions.get(navigation.entryKey) ?? stateScroll();
    if (saved) this.restore(el, saved);
  }

  /** 내용이 그 위치까지 자랄 때까지(최대 `RESTORE_WAIT_MS`) 기다렸다 되돌린다. 사람이 먼저 굴리면 멈춘다. */
  private restore(el: Element, to: ScrollPosition): void {
    let frame = 0;
    const deadline = performance.now() + RESTORE_WAIT_MS;
    const stop = () => {
      cancelAnimationFrame(frame);
      for (const type of USER_SCROLL_EVENTS) el.removeEventListener(type, stop);
      this.cancelRestore = undefined;
    };
    for (const type of USER_SCROLL_EVENTS) el.addEventListener(type, stop, { passive: true });
    this.cancelRestore = stop;
    const step = () => {
      const reachable = el.scrollHeight - el.clientHeight >= to.y && el.scrollWidth - el.clientWidth >= to.x;
      if (reachable || performance.now() >= deadline) {
        el.scrollTo(to.x, to.y);
        stop();
        return;
      }
      frame = requestAnimationFrame(step);
    };
    step();
  }

  private writeToCurrentEntry(position: ScrollPosition): void {
    const state = window.history.state;
    const base = typeof state === 'object' && state !== null && !Array.isArray(state) ? state : {};
    window.history.replaceState({ ...base, scroll: position }, '');
  }

  /** 새로 고침·문서 이동 직전 — 지금 항목의 위치를 그 항목 상태에 남긴다. */
  private persist = () => {
    if (!this.currentEntryKey()) return;
    const el = this.target();
    this.writeToCurrentEntry({ x: el.scrollLeft, y: el.scrollTop });
  };
}

/** 지금 항목 상태에 남은 위치(새로 고침 · 다른 문서에서 돌아옴). */
function stateScroll(): ScrollPosition | undefined {
  const scroll = (window.history.state as { scroll?: unknown } | null)?.scroll as Partial<ScrollPosition> | undefined;
  return typeof scroll?.x === 'number' && typeof scroll.y === 'number' ? { x: scroll.x, y: scroll.y } : undefined;
}

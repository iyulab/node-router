import type { NavigateOptions } from '../types/NavigateOptions.js';

/**
 * 라우팅 위치의 원천.
 * - `history`: 주소의 경로(`/app/orders/1`)가 곧 라우트다. 서버가 모든 경로에 앱을 돌려줘야 새로고침·딥링크가 동작한다.
 * - `hash`: `#` 뒤(`/app/#/orders/1`)가 라우트다. 서버는 문서 하나만 서빙하면 된다(정적 호스팅).
 */
export type RouterMode = 'history' | 'hash';

/** 라우터가 쓰는 히스토리 상태 — `u-link` 가 라우터 인스턴스 없이 basepath·모드를 읽는 통로다. */
export interface RouterHistoryState {
  basepath?: string;
  mode?: RouterMode;
  /** 기록 항목의 키(`RouteNavigation.entryKey`) — 라우터가 심는다. */
  entryKey?: string;
  [key: string]: unknown;
}

/**
 * 라우터가 히스토리 상태(basepath·모드)를 막 적었다는 알림 — `window` 에 쏜다.
 *
 * `u-link` 는 href 를 그릴 때 그 상태를 읽는데, 셸이 라우터보다 먼저 그려지면(링크가 든 레이아웃을 띄운 뒤
 * 라우터를 만드는 앱) 상태가 아직 없어 history 형식으로 그려진 채 남는다. 클릭은 가로채지므로 옳게 가지만
 * href 를 직접 쓰는 경로 — 새 탭 · 주소 복사 — 가 다른 화면을 연다. 이 알림을 받은 링크가 다시 맞춘다.
 */
export const ROUTER_STATE_EVENT = 'u-router-state';

let throttleWarned = false;

/**
 * 기록 쓰기 예산 — 토큰 통(용량 40 · 초당 4 채움). 한 10초 안의 쓰기는 많아야 40 + 40 = 80 으로 브라우저 한도(100) 아래다.
 *
 * Safari 는 10초에 100번을 넘는 `replaceState` · `pushState` 에 `SecurityError` 를 던진다(Firefox 도 한도가 있다 · Chromium 은
 * 넘친 호출을 조용히 버린다). 예산 안의 쓰기는 종전처럼 그 자리에서 주소를 바꾸므로, 보통의 이동 · 선택(몇십 번 몰려도)은
 * 아무것도 달라지지 않는다. 예산이 바닥난 뒤의 교체(`replace`)는 «대기 기록» 으로 두고 토큰이 차는 대로 마지막 것만 쓴다 —
 * 주소에 묶인 선택을 화살표 키 반복으로 계속 넘겨도 주소는 초당 네 번 따라가고 한도에 닿지 않는다. 새 항목(`push`)은 미루지
 * 않는다(기록 하나가 이동 하나라는 계약 — 예산은 쓴다). 문서를 떠나는 중(`pagehide`)의 쓰기도 미루지 않는다.
 */
const WRITE_CAPACITY = 40;
const WRITE_REFILL_PER_MS = 4 / 1000;
let writeTokens = WRITE_CAPACITY;
let refilledAt = -Infinity;
let leaving = false;

/** 미룬 교체 — 지금 항목에 쓸 상태와 주소(절대). `base` 는 미룰 때의 `history.state` — 항목이 바뀌었는지 알아본다. */
interface PendingEntry {
  state: unknown;
  url: string;
  base: unknown;
}
let pending: PendingEntry | undefined;
let pendingTimer: ReturnType<typeof setTimeout> | undefined;
let listening = false;

/**
 * 지금 항목의 기록 상태 — 미룬 교체가 있으면 그것. 라우터 · 선택 채널 · 링크는 `window.history.state` 대신 이것을 읽는다
 * (미룬 동안 읽으면 바로 앞 값 위에 다음 값을 쌓아야 한다 — 두 선택 채널이 서로의 쿼리를 지우지 않게).
 */
export function historyState(): unknown {
  const entry = livePending();
  return entry ? entry.state : window.history.state;
}

/** 지금 항목의 주소(절대 href) — 미룬 교체가 있으면 그 주소. `window.location.href` 대신 이것을 읽는다. */
export function locationHref(): string {
  return livePending()?.url ?? window.location.href;
}

/** 미룬 교체가 아직 지금 항목의 것인가 — 뒤로·앞으로 가기 · 남의 기록 쓰기로 항목 상태가 바뀌었으면 버린다. */
function livePending(): PendingEntry | undefined {
  if (pending && window.history.state !== pending.base) dropPending();
  return pending;
}

function dropPending(): void {
  pending = undefined;
  if (pendingTimer !== undefined) clearTimeout(pendingTimer);
  pendingTimer = undefined;
}

/** 미룬 교체를 지금 쓴다 — 새 항목을 쌓기 직전 · 문서를 떠날 때 · 토큰이 찼을 때. */
function flushPending(): void {
  const entry = livePending();
  if (!entry) return;
  dropPending();
  write('replace', entry.state, entry.url);
}

function refill(): void {
  const now = performance.now();
  writeTokens = Math.min(WRITE_CAPACITY, writeTokens + (now - refilledAt) * WRITE_REFILL_PER_MS);
  refilledAt = now;
}

function schedulePending(): void {
  if (pendingTimer !== undefined) return;
  const wait = Math.max(0, (1 - writeTokens) / WRITE_REFILL_PER_MS);
  pendingTimer = setTimeout(() => {
    pendingTimer = undefined;
    refill();
    if (writeTokens >= 1) flushPending();
    else if (pending) schedulePending();
  }, Math.ceil(wait));
}

/** 처음 쓸 때 한 번 — 뒤로·앞으로 가기는 미룬 교체를 버리고(떠난 항목의 것), 문서를 떠날 때는 쓰고 이후 쓰기를 미루지 않는다. */
function listen(): void {
  if (listening) return;
  listening = true;
  window.addEventListener('popstate', dropPending, true);
  window.addEventListener('pagehide', () => { leaving = true; flushPending(); }, true);
  window.addEventListener('pageshow', () => { leaving = false; }, true);
}

/**
 * 기록 항목을 쓴다(`replaceState` / `pushState`) — 위 예산 안이면 곧바로, 바닥난 뒤의 교체는 합쳐서 나중에. 그래도 브라우저가
 * 거부하면 예외를 앱에 올리지 않고 그 한 번의 쓰기만 건너뛴다(화면 · 채널 값은 그대로, 주소는 다음 쓰기에서 따라온다). 다른 오류는
 * 그대로 던진다. 거부되면 `false`(미룬 교체는 `true`).
 */
export function writeHistoryEntry(kind: 'replace' | 'push', state: unknown, url?: string): boolean {
  listen();
  refill();
  if (kind === 'push') {
    flushPending();
    return write('push', state, url);
  }
  if (writeTokens >= 1 || leaving) {
    // 이 교체가 미룬 것을 대신한다(같은 항목의 더 새로운 상태).
    dropPending();
    return write('replace', state, url);
  }
  const base = livePending()?.base ?? window.history.state;
  const target = new URL(url ?? locationHref(), locationHref()).href;
  pending = { state, url: target, base };
  schedulePending();
  return true;
}

function write(kind: 'replace' | 'push', state: unknown, url?: string): boolean {
  writeTokens -= 1;
  try {
    if (kind === 'replace') window.history.replaceState(state, '', url);
    else window.history.pushState(state, '', url);
    return true;
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'SecurityError')) throw error;
    if (!throttleWarned) {
      throttleWarned = true;
      // diagnostic: 한 번만 — 넘친 호출마다 쓰면 콘솔이 같은 줄로 덮인다.
      console.warn('[@iyulab/router] the browser refused a history update (too many in a short time); the address catches up on the next one:', error.message);
    }
    return false;
  }
}

/** 현재 히스토리 상태가 선언한 모드(라우터가 아직 상태를 쓰지 않았으면 `history`). */
export function stateMode(): RouterMode {
  return (historyState() as RouterHistoryState | null)?.mode === 'hash' ? 'hash' : 'history';
}

/**
 * 지금 브라우저 위치를 «라우팅 URL» 로 — 오리진 + 라우트 경로 + 쿼리.
 * hash 모드에서 `#` 이 비었거나 `/` 로 시작하지 않으면 루트(`/`)다.
 */
export function currentRouteUrl(mode: RouterMode): URL {
  const here = new URL(locationHref());
  if (mode === 'history') return here;
  const inner = here.hash.slice(1);
  return new URL(inner.startsWith('/') ? inner : '/', here.origin);
}

/**
 * 지금 위치의 라우트 경로(경로 + 쿼리 + 해시) — `RouteContext.path` 와 같은 형식이다.
 *
 * 라우터 인스턴스 없이 읽는다(모드는 라우터가 적은 히스토리 상태에서). 라우터 이벤트(`route-begin`)를 듣는 위젯은
 * 그 이벤트가 **자기가 붙기 전에** 지나갔을 수 있다 — 라우트 결과물로 그려지는 셸이 그렇다. 붙을 때 이것으로 시작한다.
 */
export function currentRoutePath(): string {
  const url = currentRouteUrl(stateMode());
  return url.pathname + url.search + url.hash;
}

/**
 * 라우터가 받는 href 를 «라우팅 URL 의 href» 로 정규화한다. history 모드는 그대로다.
 * hash 모드에서는 `#/x` 와, 이 문서를 가리키며 `#/x` 를 단 절대 URL 을 `/x` 로 푼다 — 그 밖(경로 · 상대 경로 ·
 * 쿼리)은 이미 라우트 공간의 값이라 그대로 둔다.
 */
export function toRouteHref(href: string, mode: RouterMode): string {
  if (mode === 'history') return href;
  if (href.startsWith('#')) return href.slice(1) || '/';
  if (/^https?:/i.test(href)) {
    const url = new URL(href);
    const current = new URL(locationHref());
    const here = url.origin === current.origin && url.pathname === current.pathname;
    if (here && url.hash.startsWith('#/')) return url.hash.slice(1);
    if (here && !url.hash) return '/';
  }
  return href;
}

/** 라우트 경로(경로 + 쿼리 + 해시)를 주소창에 쓸 값으로. */
export function toBrowserHref(routePath: string, routeHref: string, mode: RouterMode): string {
  if (mode !== 'hash') return routeHref;
  const current = new URL(locationHref());
  return current.pathname + current.search + '#' + routePath;
}

/** 라우터 인스턴스 없이 낸 이동 요청 — `window` 에 쏜다. 라우터가 받아 `go()` 한다(`navigate`). */
export const ROUTER_NAVIGATE_EVENT = 'u-router-navigate';

export interface RouterNavigateRequest {
  href: string;
  options?: NavigateOptions;
  /**
   * 받은 라우터가 채운다 — 이 이동의 `leave` 판정: 통과(`allowed`) · 막힘(`blocked`) · 가드가 아직 답하는 중(`pending`).
   * @internal
   */
  leave?: LeaveOutcome;
}

/** 이동 하나의 `leave` 판정 — 가드가 Promise 를 돌려주면 `pending`. */
export type LeaveOutcome = 'allowed' | 'blocked' | 'pending';

/** 이동 요청의 결과 — 받은 라우터가 있는가, 그 이동의 `leave` 판정. */
export interface NavigationRequestOutcome {
  handled: boolean;
  leave: LeaveOutcome;
}

/** 떠 있는 라우터에 이동을 요청하고, 받았는지 · `leave` 판정을 돌려준다. */
export function requestRoutedNavigation(href: string, options?: NavigateOptions): NavigationRequestOutcome {
  const detail: RouterNavigateRequest = { href, options };
  const request = new CustomEvent<RouterNavigateRequest>(ROUTER_NAVIGATE_EVENT, { detail, cancelable: true });
  const handled = !window.dispatchEvent(request);
  return { handled, leave: handled ? detail.leave ?? 'allowed' : 'allowed' };
}

/** 떠 있는 라우터에 이동을 요청한다 — 받은 라우터가 있으면 `true`. */
export function requestNavigation(href: string, options?: NavigateOptions): boolean {
  return requestRoutedNavigation(href, options).handled;
}

/**
 * 라우터 인스턴스 없이 클라이언트 이동을 요청한다 — 셸 · 링크 · 인증 만료 처리처럼 라우터를 쥐지 않은 코드의 자리다.
 *
 * 떠 있는 라우터가 요청을 받아 `go(href, options)` 한다(새 기록 항목 — `options.replace` 면 교체). 받을 라우터가 없으면
 * 문서 이동으로 간다. ⚠`history.pushState` + 합성 `popstate` 로 흉내 내지 말 것 — 그 `popstate` 는 앱이 듣는
 * «뒤로 가기» 와 구별되지 않고, 상태 없이 쓴 항목은 라우터의 기록 상태(모드 · 항목 키)를 지운다.
 */
export function navigate(href: string, options?: NavigateOptions): void {
  if (requestNavigation(href, options)) return;
  const mode = stateMode();
  const target = toBrowserHref(href, href, mode);
  if (options?.replace) window.location.replace(target);
  else window.location.assign(target);
}

declare global {
  interface WindowEventMap {
    'u-router-navigate': CustomEvent<RouterNavigateRequest>;
  }
}

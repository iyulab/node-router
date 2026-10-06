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

/** 현재 히스토리 상태가 선언한 모드(라우터가 아직 상태를 쓰지 않았으면 `history`). */
export function stateMode(): RouterMode {
  return (window.history.state as RouterHistoryState | null)?.mode === 'hash' ? 'hash' : 'history';
}

/**
 * 지금 브라우저 위치를 «라우팅 URL» 로 — 오리진 + 라우트 경로 + 쿼리.
 * hash 모드에서 `#` 이 비었거나 `/` 로 시작하지 않으면 루트(`/`)다.
 */
export function currentRouteUrl(mode: RouterMode): URL {
  if (mode === 'history') return new URL(window.location.href);
  const inner = window.location.hash.slice(1);
  return new URL(inner.startsWith('/') ? inner : '/', window.location.origin);
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
    const here = url.origin === window.location.origin && url.pathname === window.location.pathname;
    if (here && url.hash.startsWith('#/')) return url.hash.slice(1);
    if (here && !url.hash) return '/';
  }
  return href;
}

/** 라우트 경로(경로 + 쿼리 + 해시)를 주소창에 쓸 값으로. */
export function toBrowserHref(routePath: string, routeHref: string, mode: RouterMode): string {
  return mode === 'hash' ? window.location.pathname + window.location.search + '#' + routePath : routeHref;
}

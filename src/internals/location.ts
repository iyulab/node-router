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

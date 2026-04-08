import type { RouteConfig } from '../types/RouteConfig.js';

/**
 * 라우팅 체인 상태를 추적합니다.
 * - 방문한 href를 기록하여 리다이렉트 사이클을 감지합니다.
 * - 이미 실행된 route enter를 기록하여 중복 실행을 방지합니다.
 */
export class RouteTracker {
  private readonly _history = new Set<string>();
  private readonly _processed = new Set<string>();

  /** 새 네비게이션 시작 시 상태를 초기화합니다. */
  reset() {
    this._history.clear();
    this._processed.clear();
  }

  /**
   * href 방문을 기록하고 사이클 여부를 반환합니다.
   * @returns 사이클이 감지되면 true
   */
  visit(href: string): boolean {
    if (this._history.has(href)) {
      console.error('Router: Redirect cycle detected:', [...this._history, href].join(' → '));
      return true;
    }
    this._history.add(href);
    return false;
  }

  /**
   * route enter를 아직 실행하지 않았다면 키를 등록하고 true를 반환합니다.
   * 이미 실행된 route라면 false를 반환합니다 (중첩 라우트 redirect 체인에서 중복 방지).
   */
  enter(route: RouteConfig): boolean {
    const key = route.id ?? (route.path instanceof URLPattern ? route.path.pathname : String(route.path));
    if (this._processed.has(key)) return false;
    this._processed.add(key);
    return true;
  }
}

import type { FallbackRouteConfig, RouteConfig } from "./RouteConfig";
import type { RouteContext } from "./RouteContext";

/**
 * 라우터 설정
 */
export interface RouterConfig {
    /**
   * 라우터가 연결될 최상위 엘리먼트
   */
  root: HTMLElement;
  
  /**
   * 라우터의 기본 경로
   * - 라우터의 기본 경로는 URL의 시작점입니다.
   * - URLPattern을 사용하여 경로를 탐색합니다.
   * @default  '/'
   */
  basepath?: string;
  
  /**
   * 라우트 설정
   * - 라우트는 URLPattern을 사용하여 경로를 탐색합니다.
   * - 라우트는 렌더링할 엘리먼트 또는 컴포넌트를 지정합니다.
   */
  routes?: RouteConfig[];

  /**
   * 모든 라우트 전환 전에 호출되는 글로벌 enter 함수입니다.
   * - `string` 반환: 해당 경로로 redirect
   * - `false` 반환: 네비게이션 취소
   * - `true` 반환: 통과
   * @example
   * ```typescript
   * enter: async (ctx) => {
   *   if (!isAuthenticated() && ctx.pathname !== '/login') return '/login';
   * }
   * ```
   */
  enter?: (ctx: RouteContext) => Promise<string | boolean> | string | boolean;

  /**
   * 라우트 매칭 실패 또는 오류 발생 시 대체 라우트 설정
   * - 지정된 설정이 없을 경우, 기본 오류 페이지가 렌더링됩니다.
   */
  fallback?: FallbackRouteConfig;

  /**
   * `a` 태그 클릭 시 클라이언트 라우팅을 수행할지 여부를 설정합니다.
   * @default true
   */
  useIntercept?: boolean;

  /**
   * 이 라우터의 관할 밖으로 취급할 경로 접두사 목록입니다.
   * 동일 origin에 여러 SPA가 서로 다른 경로 아래에 나란히 배포된 상황에서,
   * 현재 SPA가 본인 라우트가 아닌 형제 SPA로 향하는 앵커 클릭을 가로채어
   * fallback으로 흘려 보내는 문제를 방지합니다.
   *
   * - 여기 나열된 prefix로 시작하는 href 클릭은 가로채지 않고 브라우저 기본
   *   네비게이션에 위임합니다 (전체 페이지 로드).
   * - `basepath`가 `/`가 아닌 경우에는 `basepath` 밖의 경로는 별도 설정 없이
   *   자동으로 외부 취급됩니다. 이 옵션은 `basepath: '/'`로 마운트된 SPA가
   *   동일 호스트의 다른 SPA 경로를 명시적으로 지정할 때 유용합니다.
   *
   * @example
   * ```typescript
   * // 포털 SPA가 `/`에 마운트되어 있고, 같은 호스트에 `/admin`, `/docs`가
   * // 별개 SPA로 배포된 경우
   * new Router({
   *   basepath: '/',
   *   routes: portalRoutes,
   *   externalPrefixes: ['/admin', '/docs'],
   * });
   * ```
   */
  externalPrefixes?: string[];

  /**
   * 초기 로드 시 현재 URL로 라우팅을 자동으로 수행할지 여부를 설정합니다.
   * @default true
   */
  initialLoad?: boolean;
}
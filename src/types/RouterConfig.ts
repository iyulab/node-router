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
   * 라우트를 주소의 어디에서 읽는가.
   * - `'history'`: 경로(`/app/orders/1`). 서버가 앱의 모든 경로에 같은 문서를 돌려줘야 새로고침·딥링크가 동작한다.
   * - `'hash'`: `#` 뒤(`/app/#/orders/1`). 서버는 문서 하나만 서빙하면 된다 — 정적 호스팅에서 서버 설정 없이 딥링크가
   *   동작한다. `basepath` 와 라우트 경로는 `#` 뒤에 적용된다. 라우트 안의 조각 식별자(`#section`)는 쓸 수 없다.
   * @default 'history'
   */
  mode?: 'history' | 'hash';

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
   * 초기 로드 시 현재 URL로 라우팅을 자동으로 수행할지 여부를 설정합니다.
   * @default true
   */
  initialLoad?: boolean;
}
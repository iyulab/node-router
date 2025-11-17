import type { FallbackRouteConfig, RouteConfig } from "./RouteConfig";

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
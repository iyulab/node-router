import type { RouteConfig } from "./RouteConfig";

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
   */
  basepath?: string;
  
  /**
   * 라우트 설정
   * - 라우트는 URLPattern을 사용하여 경로를 탐색합니다.
   * - 라우트는 렌더링할 엘리먼트 또는 컴포넌트를 지정합니다.
   */
  routes: RouteConfig[];
}
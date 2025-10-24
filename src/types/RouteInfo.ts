import type { RouteURL } from "./RouteURL";

/**
 * 라우터 정보
 */
export interface RouteInfo extends RouteURL {
  /**
   * 엘리먼트 또는 컴포넌트 렌더링 전에 호출되는 함수에서 반환된 데이터
   */
  data?: any;
}
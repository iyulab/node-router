/**
 * 라우팅 에러 정보
 */
export interface RouteError {
  /**
   * 에러 코드
   * - HTTP 상태 코드 또는 커스텀 에러 코드
   * @example 404, 500, 'ROUTE_NOT_FOUND'
   */
  code: number | string;

  /**
   * 에러 메시지
   * - 사용자에게 표시할 에러 메시지
   * @example 'Page not found', 'Access denied'
   */
  message: string;

  /**
   * 에러가 발생한 경로
   * - 에러가 발생한 라우트 경로
   * @example '/user/123'
   */
  path?: string;

  /**
   * 원본 에러 객체
   * - 원본 Error 객체 또는 예외 정보
   */
  original?: Error | any;

  /**
   * 에러 발생 시간
   * - 에러가 발생한 시간 (ISO 8601 형식)
   */
  timestamp?: string;
}
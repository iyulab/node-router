/**
 * 라우팅 에러 정보
 */
export class RouteError extends Error {
  /**
   * 에러 코드
   * - HTTP 상태 코드 또는 커스텀 에러 코드
   * @example 404, 500, 'ROUTE_NOT_FOUND'
   */
  public code: number | string;

  /**
   * 원본 에러 객체
   * - 원본 Error 객체 또는 예외 정보
   */
  public original?: Error | any;

  /**
   * 에러 발생 시간
   * - 에러가 발생한 시간 (ISO 8601 형식)
   */
  public timestamp: string;

  constructor(
    code: number | string,
    message: string,
    original?: Error | any
  ) {
    super(message);
    this.name = 'RouteError';
    this.code = code;
    this.original = original;
    this.timestamp = new Date().toISOString();

    // Error.captureStackTrace가 존재하면 사용 (Node.js 환경)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RouteError);
    }
  }
}

/**
 * 페이지를 찾을 수 없을 때 발생하는 에러
 */
export class NotFoundError extends RouteError {
  constructor(path: string, original?: Error | any) {
    super(404, `Page not found: ${path}`, original);
  }
}

/**
 * u-outlet 요소를 찾을 수 없을 때 발생하는 에러
 */
export class OutletMissingError extends RouteError {
  constructor() {
    super('OUTLET_MISSING', 'Router outlet element not found. Add <u-outlet> to your template.');
  }
}

/**
 * 컨텐츠 로드시 나타나는 에러
 */
export class ContentLoadError extends RouteError {
  constructor(original?: Error | any) {
    super('CONTENT_LOAD_FAILED', 'Failed to load route content. Check browser console for details.', original);
  }
}

/**
 * 컨텐츠 렌더링시 발생하는 에러
 */
export class ContentRenderError extends RouteError {
  constructor(original?: Error | any) {
    super('CONTENT_RENDER_FAILED', 'Failed to render route component. Check browser console for details.', original);
  }
}
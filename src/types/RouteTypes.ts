/**
 * 인덱스 라우트는 path가 없는 라우트입니다.
 */
export type IndexRoute = {
  /**
   * 라우터의 basepath를 따르는 라우트입니다.
   */
  index: true;
  path?: undefined;
}

/**
 * 인덱스 라우트가 아닌 라우트는 path가 필수입니다.
 */
export type NonIndexRoute = {
  index?: undefined;
  /**
   * 라우터 경로는 URLPattern을 사용하여 비교합니다.
   * @example
   * - /user/:id/:name
   * - /user/:id/:name?
   * - /user/:id/:name*
   * - /user/:id/:name+
   * - /user/:id/:name{1,3}
   * @link
   * https://developer.mozilla.org/en-US/docs/Web/API/URLPattern
   */
  path: string;
}
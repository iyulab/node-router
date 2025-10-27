/**
 * 라우터 정보
 */
export interface RouteInfo {
  /**
   * 전체 URL 정보
   * - 도메인 이름을 포함한 URL의 전체 경로입니다.
   * @example https://www.iyulab.com/home/user/1?name=iyu#profile
   */
  href: string;

  /**
   * URL 도메인 이름
   * - URL의 도메인 이름입니다.
   * @example https://www.iyulab.com
   */
  origin: string;

  /**
   * 라우터 URL 기본 경로
   * - 라우터의 현재 basepath입니다.
   * @example 
   * if basepath is /app/:id
   * set basepath to /app/123
   */
  basepath: string;

  /**
   * 라우터 URL 전체 경로
   * - 도메인 이름을 제외한 URL의 전체 경로입니다.
   * @example /home/user/1?name=iyu#profile
   */
  path: string;

  /**
   * 라우터 URL 절대 경로
   * - 쿼리스트링과 해시를 제외한 URL 경로입니다.
   * @example /home/user/1
   */
  pathname: string;

  /**
   * 라우터 URL 파라미터
   * - URLPattern을 사용하여 파싱된 파라미터입니다.
   * @example 만약 URL이 /user/:id/:name 일경우
   * ```typescript
   * const id = params.id;
   * const name = params.name;
   * ```
   */
  params: { [key: string]: string | undefined };

  /**
   * 라우터 URL 쿼리스트링
   * - URLSearchParams를 사용하여 파싱된 쿼리스트링입니다.
   * @example 만약 URL이 ?page=1&size=10 일경우
   * ```typescript
   * const page = query.get('page');
   * const size = query.get('size');
   * ```
   */
  query: URLSearchParams;

  /**
   * 라우터 URL 해시
   * - URL의 해시값입니다. 해시값은 하나만 사용할 수 있습니다.
   * - #profile#user 두개 이상의 해시값은 하나로 취급합니다.
   * @example #profile
   */
  hash?: string;

  /**
   * 엘리먼트 또는 컴포넌트 렌더링 전에 호출되는 함수에서 반환된 데이터
   */
  data?: any;
}

// window.route 타입 선언
declare global {
  interface Window {
    route: RouteInfo;
  }
}
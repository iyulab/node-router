import { RouteError } from "./RouteError";

/**
 * 라우터 정보
 */
export interface RouteContext {
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
   * 현재 라우팅의 진행 상태를 업데이트하여, window 객체의 'route-progress' 이벤트를 트리거합니다.
   * 여러 라우팅이 호출되는 경우, 가장 최근의 라우팅의 진행 상태만 반영되며, 나머지는 무시됩니다.
   * @param value 진행 상태 값 (0~100)
   */
  progress: (value: number) => void;

  /**
   * 매칭된 라우트 체인의 병합된 메타데이터
   * - 부모 라우트에서 자식 라우트 순서로 병합됩니다.
   */
  metadata: Record<string, unknown>;

  /**
   * 이 화면에 어떻게 왔는가 — 이동 종류와 그 기록 항목.
   * - 화면이 «돌아왔는가»(`traverse`)와 «새로 왔는가»(`push`)를 가르는 자리다 — 스크롤·선택을 되돌릴지 정하는 쪽이 읽는다.
   */
  navigation: RouteNavigation;
}

/**
 * 이동 종류 — 플랫폼 Navigation API 의 `NavigationType` 과 같은 어휘다.
 * - `push`: 새 기록 항목(링크 · `go()` · 첫 방문)
 * - `replace`: 지금 항목을 바꿈(`replace` · 리다이렉트 · 같은 주소로의 이동)
 * - `reload`: 새로 고침으로 들어온 첫 라우팅
 * - `traverse`: 뒤로·앞으로 가기로 이미 있던 항목에 돌아옴
 */
export type RouteNavigationType = 'push' | 'replace' | 'reload' | 'traverse';

export interface RouteNavigation {
  /** 이동 종류 */
  type: RouteNavigationType;
  /**
   * 기록 항목의 키 — 그 항목에 돌아오면(`traverse` · `reload`) 같은 값이다. `replace` 는 같은 칸이라 키를 잇는다
   * (Navigation API 의 `key` 와 같은 뜻). 항목별로 무언가(스크롤 · 선택)를 기억할 때 이것으로 묶는다.
   */
  entryKey: string;
}

export interface FallbackRouteContext extends RouteContext {
  /**
   * 라우팅 에러 정보
   * - 라우팅 중 발생한 에러 정보를 포함합니다.
   */
  error: RouteError;
}
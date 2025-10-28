import type { TemplateResult } from "lit";
import type { ReactElement } from "react";
import type { RouteInfo } from "./RouteInfo";

/**
 * 공통 라우트 속성
 */
interface BaseRouteConfig {
  /**
   * 라우터에서 사용하는 식별자
   */
  id?: string;

  /**
   * 브라우저의 타이틀이 설정에 따라 변경됩니다.
   */
  title?: string;

  /**
   * 라우트에 대응하는 렌더링 함수
   * - 라우트 정보를 받아 HTMLElement, ReactElement, 또는 LitElement TemplateResult를 반환합니다.
   * @param info 라우팅 정보
   * @example
   * ```typescript
   * const route = {
   *    path: '/user',
   *    render: (info) => html`<user-page .routeInfo=${info}></user-page>`,
   * }
   * ```
   */
  render: (info: RouteInfo) => HTMLElement | ReactElement | TemplateResult<1>;

  /**
   * 중첩 라우트
   */
  children?: RouteConfig[];

    /**
   * 라우터 URL 변경시 렌더링을 강제할지 여부
   * - 기본값으로 children을 가질때 false로 설정되며, children이 없을 경우 true로 설정됩니다.
   * - true로 설정하면 기존 렌더링을 무시하고 새로 렌더링합니다.
   */
  force?: boolean;
}

/**
 * 인덱스 라우트 타입
 */
interface IndexRouteConfig extends BaseRouteConfig {
  /**
   * true일 경우 인덱스 라우트입니다.
   * path는 강제로 빈 문자열로 설정됩니다.
   */
  index: true;

  /**
   * 인덱스 라우트의 URLPattern (자동 설정됨)
   * 부모 라우트의 basepath를 상속받습니다.
   */
  path?: URLPattern;
}

/**
 * 경로 라우트 타입
 */
interface PathRouteConfig extends BaseRouteConfig {
  /**
   * 라우터 경로는 string 또는 URLPattern을 사용할 수 있습니다.
   * string일 경우 자동으로 URLPattern으로 변환됩니다.
   * @example
   * - "/user/:id/:name"
   * - "/user/:id/:name?"
   * - "/user/:id/:name*"
   * - "/user/:id/:name+"
   * - "/user/:id/:name{1,3}"
   * @link
   * https://developer.mozilla.org/en-US/docs/Web/API/URLPattern
   */
  path: string | URLPattern;
}

/**
 * 라우트 타입 (인덱스 라우트 또는 경로 라우트)
 */
export type RouteConfig = IndexRouteConfig | PathRouteConfig;
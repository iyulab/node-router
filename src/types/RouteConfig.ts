import type { LitElement } from "lit";
import type { ComponentType } from "react";
import type { RouteInfo } from "./RouteInfo";

/**
 * 라우트 타입
 */
export type RouteConfig = {
  /**
   * 라우터에서 사용하는 식별자
   */
  id?: string;

  /**
   * 브라우저의 타이틀이 설정에 따라 변경됩니다.
   */
  title?: string;

  /**
   * true일 경우 인덱스 라우트입니다.
   * path는 강제로 빈 문자열로 설정됩니다.
   */
  index?: boolean;
  
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
  path?: string;

  /**
   * 라우터에서 사용하는 URLPattern
   * @link
   * https://developer.mozilla.org/en-US/docs/Web/API/URLPattern
   */
  pattern?: URLPattern;

  /**
   * 라우터 URL 변경시 렌더링을 강제할지 여부
   * - 기본값으로 children을 가질때 false로 설정되며, children이 없을 경우 true로 설정됩니다.
   * - true로 설정하면 기존 렌더링을 무시하고 새로 렌더링합니다.
   */
  force?: boolean;

  /**
   * 중첩 라우트
   */
  children?: RouteConfig[];

  /**
   * 엘리먼트 또는 컴포넌트를 렌더링하기 전에 호출되는 함수
   * @param 라우팅 정보
   */
  loader?: (info: RouteInfo) => Promise<any>;

  /**
   * 렌더링할 LitElement
   * - LitElement 클래스 또는 태그 이름을 사용합니다.
   * @example
   * ```typescript
   * import { UserPage } from './pages';
   * const route = {
   *    path: '/user',
   *    element: 'user-page' | UserPage,
   * }
   * ```
   */
  element?: typeof LitElement | string;

  /**
   * 렌더링할 ReactComponent
   * - ReactComponent의 모듈을 사용합니다.
   * @example
   * ```typescript
   * import { UserPage } from './pages';
   * const route = {
   *    path: '/user',
   *    component: UserPage,
   * }
   * ```
   */
  component?: ComponentType;
}
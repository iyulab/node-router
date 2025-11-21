import type { TemplateResult } from "lit";
import type { ReactElement } from "react";
import type { RouteContext, FallbackRouteContext } from "./RouteContext";

export type RenderResult = HTMLElement | ReactElement | TemplateResult<1> | false;
export type FallbackRenderResult = HTMLElement | ReactElement | TemplateResult<1>;

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
   * 라우터 경로는 string 또는 URLPattern을 사용할 수 있습니다.
   * string일 경우 자동으로 URLPattern으로 변환됩니다.
   * @default '/'
   * @example
   * - "/user/:id/:name"
   * - "/user/:id/:name?"
   * - "/user/:id/:name*"
   * - "/user/:id/:name+"
   * @link
   * https://developer.mozilla.org/en-US/docs/Web/API/URLPattern
   */
  path?: string | URLPattern;

  /**
   * 라우트 정보를 받아 렌더링 결과를 반환합니다. 
   * @param ctx 현재 라우팅 정보 및, 진행 상태 콜백을 포함하는 Context 객체가 인자로 전달됩니다.
   * @example
   * ```typescript
   * const route = {
   *    path: '/user:id',
   *    render: async (ctx) => {
   *      // 사용자 정보를 비동기로 가져오는 예시
   *      const userId = ctx.params.id;
   *      ctx.progress(30);
   *      const userData = await fetchUserData(userId);
   *      ctx.progress(70);
   *      return html`<user-profile .data=${userData}></user-profile>`;
   *   }
   * }
   * ```
   */
  render?: (ctx: RouteContext) => Promise<RenderResult> | RenderResult;

  /**
   * 라우터 URL 변경시 렌더링을 강제할지 여부
   * - 기본값으로 children을 가질때 false로 설정되며, children이 없을 경우 true로 설정됩니다.
   * - true로 설정하면 기존 렌더링을 무시하고 새로 렌더링합니다.
   */
  force?: boolean;

  /**
   * 경로 매칭시 대소문자 구분 여부
   * @default false
   */
  ignoreCase?: boolean;
}

interface IndexRouteConfig extends BaseRouteConfig {
  /**
   * 현재 경로의 인덱스 라우트임을 나타냅니다.
   * - 인덱스 라우트는 부모 경로와 동일한 경로를 가지며, path는 자동으로 설정됩니다.
   */
  index: true;
}

interface NonIndexRouteConfig extends BaseRouteConfig {
  /**
   * 인덱스 라우트가 아님을 나타냅니다.
   */
  index?: false;

  /**
   * 하위 라우트 설정, 재귀적으로 RouteConfig 배열을 가질 수 있습니다.
   * - 하위 라우트가 있는 경우, 부모 라우트의 경로를 기준으로 매칭됩니다.
   */
  children?: RouteConfig[];
}

export type RouteConfig = IndexRouteConfig | NonIndexRouteConfig;

export interface FallbackRouteConfig {
  /**
   * 브라우저의 타이틀이 설정에 따라 변경됩니다.
   */
  title?: string;

  /**
   * 라우팅 실패 시 표시할 렌더링 결과를 반환합니다.
   * - 오류가 발생할 경우 또는 렌더링 결과가 false일 경우 호출됩니다.
   * @param ctx 현재 라우팅 정보 및 오류 정보를 포함하는 Context 객체가 인자로 전달됩니다.
   * @example
   * ```typescript
   * const fallbackRoute = {
   *    title: 'Not Found',
   *    render: (ctx) => {
   *      if (ctx.error) {
   *        return html`<error-page .error=${ctx.error}></error-page>`;
   *      }
   *      return html`<not-found-page></not-found-page>`;
   *    }
   * }
   * ```
   */
  render?: (ctx: FallbackRouteContext) => Promise<FallbackRenderResult> | FallbackRenderResult;
}
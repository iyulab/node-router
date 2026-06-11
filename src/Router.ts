import { UErrorPage } from './components/UErrorPage.js';
import { UOutlet } from './components/UOutlet.js';
import { getRandomID } from './internals/crypto-helpers.js';
import { findOutlet, findOutletOrThrow, findAnchorFrom, waitOutlet } from './internals/element-helpers.js';
import { getRoutes, setRoutes  } from './internals/route-helpers.js';
import { absolutePath, isExternalUrl, parseUrl } from './internals/url-helpers.js';
import { RouteTracker } from './internals/RouteTracker.js';
import { AccessDeniedError, ContentLoadError, ContentRenderError, NotFoundError, RouteError } from './types/RouteError.js';
import { RouteBeginEvent, RouteDoneEvent, RouteErrorEvent, RouteProgressEvent } from './types/RouteEvent.js';
import type { RouteContext } from './types/RouteContext.js';
import type { RouterConfig } from './types/RouterConfig.js';
import type { FallbackRouteConfig, RouteConfig } from './types/RouteConfig.js';
import type { NavigateOptions } from './types/NavigateOptions.js';

/**
 * `lit-element`, `react`를 지원하는 SPA 클라이언트 라우터 객체입니다.
 */
export class Router {
  private readonly _rootElement: HTMLElement;
  private readonly _basepath: string;
  private readonly _routes: RouteConfig[];
  private readonly _fallback?: FallbackRouteConfig;
  private readonly _enter?: RouterConfig['enter'];
  private readonly _tracker = new RouteTracker();

  /** 현재 라우팅 요청 ID */
  private _requestID?: string;
  /** 현재 라우팅 정보 */
  private _context?: RouteContext;

  constructor(config: RouterConfig) {
    this.destroy();

    this._rootElement = config.root;
    this._basepath = absolutePath(config.basepath || '/');
    this._routes = setRoutes(config.routes || [], this._basepath);
    this._fallback = config.fallback;
    this._enter = config.enter;
    window.addEventListener('popstate', this.handleWindowPopstate);

    if (config.useIntercept !== false) {
      this._rootElement.addEventListener('click', this.handleRootElementClick);
    }
    if (config.initialLoad !== false) {
      void waitOutlet(this._rootElement).then(() => {
        this.go(window.location.href);
      });
    }
  }

  /** 객체를 정리하고 이벤트 리스너를 제거합니다. */
  public destroy() {
    window.removeEventListener('popstate', this.handleWindowPopstate);
    this._rootElement?.removeEventListener('click', this.handleRootElementClick);
    this._requestID = undefined;
    this._context = undefined;
  }

  /** 라우터의 기본 경로 반환 */
  public get basepath() {
    return this._basepath;
  }
  /** 등록된 라우트 정보 반환 */
  public get routes() {
    return this._routes;
  }
  /** 현재 라우팅 정보 반환 */
  public get context() {
    return this._context;
  }

  /**
   * 지정한 경로의 클라이언트 라우팅을 수행합니다. 상대경로일 경우 basepath와 조합되어 이동합니다.
   * @param href 이동할 경로
   * @param options 네비게이션 옵션
   */
  public async go(href: string, options?: NavigateOptions) {
    if (!options?.isRedirect) this._tracker.reset();

    const requestID = getRandomID();
    this._requestID = requestID;
    const context = parseUrl(href, this._basepath);

    // 리다이렉트 체인에서만 사이클 감지 (최초 진입은 항상 허용)
    if (options?.isRedirect && this._tracker.visit(context.href)) return;

    // 히스토리 업데이트: isRedirect/replace면 replaceState (뒤로가기에서 경유지 제거)
    const useReplace = options?.isRedirect || options?.replace || context.href === window.location.href;
    const historyState = { basepath: context.basepath, ...options?.state };
    if (useReplace) {
      window.history.replaceState(historyState, '', context.href);
    } else {
      window.history.pushState(historyState, '', context.href);
    }

    let outlet: UOutlet | undefined = undefined;
    let title: string | undefined = undefined;
    try {
      outlet = findOutletOrThrow(this._rootElement);
      
      // 라우트 매칭 및 context 완성 (params, metadata)
      // → enter/이벤트 실행 전에 context를 완전히 채웁니다.
      const routes = getRoutes(this._routes, context.pathname);
      if (routes.length === 0) throw new NotFoundError(context.href);

      const lastRoute = routes[routes.length - 1];
      if (lastRoute.path instanceof URLPattern) {
        context.params = lastRoute.path.exec({ pathname: context.pathname })?.pathname.groups || {};
      }

      context.progress = (value) => {
        if (this._requestID !== requestID) return;
        const progress = Math.max(0, Math.min(100, Math.round(value)));
        window.dispatchEvent(new RouteProgressEvent(context, progress));
      };

      // 글로벌 enter: redirect 체인 중에는 skip (최초 진입 시 1회만 실행)
      if (this._enter && !options?.isRedirect) {
        const result = await this._enter(context);
        if (this._requestID !== requestID) return;
        if (result === false) throw new AccessDeniedError(context.pathname);
        if (typeof result === 'string') return void this.go(result, { isRedirect: true });
      }

      // context 확정 및 라우트 시작 이벤트 발생
      this._context = context;
      window.dispatchEvent(new RouteBeginEvent(context));
      for (const route of routes) {
        if (this._requestID !== requestID) return;
        // 라우트 메타데이터 병합 (부모 → 자식)
        context.metadata = { ...context.metadata, ...route.metadata };

        // 라우트별 enter: 이미 실행된 route는 skip (redirect 체인에서 부모 enter 중복 방지)
        if (route.enter && this._tracker.enter(route)) {
          const result = await route.enter(context);
          if (this._requestID !== requestID) return;
          if (result === false) throw new AccessDeniedError(context.pathname);
          if (typeof result === 'string') return void this.go(result, { isRedirect: true });
        }

        if (!route.render) continue;

        let content: unknown;
        try {
          content = await route.render(context);
          if (content === false || content === undefined || content === null) {
            throw new Error('Failed to load content for the route.');
          }
        } catch (e) {
          throw new ContentLoadError(e);
        }

        try {
          await outlet.render(content, { id: route.id, force: route.force });
        } catch (e) {
          throw new ContentRenderError(e);
        }

        if ('children' in route && route.children && route.children.length > 0) {
          // 자식 라우트가 있는 경우, 렌더링된 컨텐츠 내의 outlet이 준비될 때까지 대기
          outlet = await waitOutlet(outlet, 2_000, true);
        } else {
          // 자식 라우트가 없는 경우, 다음 라우트에서 같은 outlet이 재사용될 수 있도록 skip 옵션으로 다시 찾기
          outlet = findOutlet(outlet, true) || outlet;
        }
        title = route.title || title;
      }
      // 라우트 완료 이벤트 발생
      window.dispatchEvent(new RouteDoneEvent(context));
    } catch (error: any) {
      const routeError = error instanceof RouteError ? error
        : new RouteError(
          error?.status || error?.code || 'UNKNOWN_ERROR', 
          error?.message || 'An unexpected error occurred', 
          error);

      window.dispatchEvent(new RouteErrorEvent(context, routeError));
      console.error('Routing error:', routeError.original || routeError);

      try {
        const content = this._fallback?.render 
          ? await this._fallback.render({ ...context, error: routeError }) 
          : new UErrorPage(routeError);
        if (outlet) {
          outlet.render(content, { id: getRandomID(), force: true });
        } else {
          document.body.innerHTML = '';
          document.body.appendChild(content instanceof Node ? content : new UErrorPage(routeError));
        }
        title = this._fallback?.title || routeError.message || 'Error';
      } catch (pageError) {
        console.error('Failed to render error component:', pageError);
        console.error('Original error:', routeError.original || routeError);
      }
    } finally {
      document.title = title || document.title;
    }
  }

  /** 브라우저 히스토리 이벤트가 발생시 라우팅 처리 */
  private handleWindowPopstate = async (_: PopStateEvent) => {
    await this.go(window.location.href);
  };

  /** 클릭 이벤트에서 라우터로 처리할 앵커를 찾아 클라이언트 라우팅 수행 */
  private handleRootElementClick = async (e: MouseEvent) => {
    try {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;

      const anchor = findAnchorFrom(e);
      if (!anchor) return;

      const href = anchor.getAttribute('href') || anchor.href;
      if (!href) return;
      if (isExternalUrl(href)) return;
      if (anchor.hasAttribute('download')) return;
      if (anchor.getAttribute('rel') === 'external') return;
      if (anchor.target && anchor.target !== '') return;

      const pathname = new URL(anchor.href).pathname;
      if (this._basepath !== '/' && !pathname.startsWith(this._basepath)) return;
      // 등록된 라우트에 매칭되지 않는 경로는 가로채지 않고 네이티브 내비게이션에 맡깁니다.
      // (특히 basepath '/'에서 다른 앱의 경로를 soft-404로 렌더하는 것을 방지)
      if (getRoutes(this._routes, pathname).length === 0) return;

      e.preventDefault();
      await this.go(anchor.href);
    } catch {
      // 예외는 무시하고 기본 동작 유지
    }
  };
}
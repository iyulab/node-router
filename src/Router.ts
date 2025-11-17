import { ErrorPage } from './components/ErrorPage.js';
import { Outlet } from './components/Outlet.js';
import { getRandomID, absolutePath, isExternalUrl, parseUrl, findAnchorFromEvent, findOutlet, getRoutes, setRoutes, findOutletOrThrow } from './internals';
import { RouteBeginEvent, RouteDoneEvent, RouteErrorEvent, RouteError, NotFoundError, ContentLoadError, ContentRenderError, RouteProgressEvent } from './types';
import type { RouteConfig, RouteContext, RouterConfig, FallbackRouteConfig, RenderResult } from './types';

/**
 * `lit-element`와 `react-component` 기반의 클라이언트 사이드 라우터
 */
export class Router {
  private readonly _rootElement: HTMLElement;
  private readonly _basepath: string;
  private readonly _routes: RouteConfig[];
  private readonly _fallback?: FallbackRouteConfig;
  
  /** 현재 라우팅 요청 ID */
  private _requestID?: string;
  /** 현재 라우팅 정보 */
  private _context?: RouteContext;

  constructor(config: RouterConfig) {
    this._rootElement = config.root;
    this._basepath = absolutePath(config.basepath || '/');
    this._routes = setRoutes(config.routes || [], this._basepath);
    this._fallback = config.fallback;

    window.removeEventListener('popstate', this.handleWindowPopstate);
    window.addEventListener('popstate', this.handleWindowPopstate);

    if (config.useIntercept !== false) {
      this._rootElement.removeEventListener('click', this.handleRootClick);
      this._rootElement.addEventListener('click', this.handleRootClick);
    }
    if (config.initialLoad !== false) {
      void this.go(window.location.href);
    }
  }

  /** 객체를 정리하고 이벤트 리스너를 제거합니다. */
  public destroy() {
    window.removeEventListener('popstate', this.handleWindowPopstate);
    this._rootElement.removeEventListener('click', this.handleRootClick);
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
   */
  public async go(href: string) {
    // 요청 ID 생성
    const requestID = getRandomID();
    this._requestID = requestID;

    // URL 분석
    const context = parseUrl(href, this._basepath);
    if (context.href === this._context?.href) return;

    // 각 라우트에 대해 고유한 progress 콜백 생성
    const progressCallback = (value: number) => {
      // 오래된 요청은 무시, 현재 시점의 요청만 처리
      if (this._requestID !== requestID) return;
      // 정수 0..100 범위 보정
      const progress = Math.max(0, Math.min(100, Math.round(value)));
      // 라우트 진행 이벤트 발생
      window.dispatchEvent(new RouteProgressEvent(context, progress));
    };
    context.progress = progressCallback;

    // 브라우저 히스토리 업데이트
    if (context.href !== window.location.href) {
      window.history.pushState({ basepath: context.basepath }, '', context.href);
    } else {
      window.history.replaceState({ basepath: context.basepath }, '', context.href);
    }
    
    let outlet: Outlet | undefined = undefined;
    try {
      // 라우트 시작 이벤트 발생
      if(this._requestID !== requestID) return;
      window.dispatchEvent(new RouteBeginEvent(context));

      // 일치하는 라우트 찾기
      const routes = getRoutes(context.pathname, this._routes);
      const lastRoute = routes[routes.length - 1];

      //// 현재 라우트 정보 업데이트
      if (lastRoute && lastRoute.path instanceof URLPattern) {
        // 인덱스 or 경로 라우트의 path URLPattern으로 params 추출
        context.params = lastRoute.path.exec({ pathname: context.pathname })?.pathname.groups || {};
      }
      this._context = context;

      // Outlet 렌더링(부모 route부터 u-outlet을 찾아서 렌더링합니다.)
      outlet = findOutletOrThrow(this._rootElement);
      let title = undefined;
      let content: RenderResult | false | null = null;
      let element: HTMLElement | null = null;

      if (routes.length === 0) {
        throw new NotFoundError(context.href);
      }
      for (const route of routes) {
        if(this._requestID !== requestID) return;

        // 렌더 함수가 없는 경우 건너뜀
        if(!route.render) continue;

        // 라우트에 해당하는 컨텐츠 가져오기
        try {  
          content = await route.render(context);
          if (content === false || content === null) {
            throw new Error('Failed to load content for the route.');
          }
        } catch (LoadError) {
          throw new ContentLoadError(LoadError);
        }

        if(this._requestID !== requestID) return;
        
        // Outlet에 실제 컨텐츠 렌더링 수행
        try {
          element = await outlet.renderContent({ id: route.id, content: content, force: route.force });
        } catch (renderError) {
          throw new ContentRenderError(renderError);
        }
        
        // 다음 라우트를 위한 outlet 찾기
        outlet = findOutlet(element) || outlet;
        title = route.title || title;
      }

      // 문서 제목 업데이트, 라우트 완료 이벤트 발생
      document.title = title || document.title;
      window.dispatchEvent(new RouteDoneEvent(context));

    } catch (error: any) {
      // 이벤트 생성 및 에러 로깅
      const routeError = error instanceof RouteError ? error
      : new RouteError(
        error.status || error.code || 'UNKNOWN_ERROR',
        error.message || 'An unexpected error occurred',
        error
      );
      window.dispatchEvent(new RouteErrorEvent(context, routeError));
      console.error('Routing error:', routeError.original);

      // Fallback 또는 ErrorPage 렌더링
      try {
        if (this._fallback && this._fallback.render && outlet) {
          const fallbackContent = await this._fallback.render({ ...context, error: routeError });
          outlet.renderContent({ id: '#fallback', content: fallbackContent, force: true });
          document.title = this._fallback.title || document.title;
        } else {
          const errorContent = new ErrorPage();
          errorContent.error = error;
          if (outlet) {
            outlet.renderContent({ id: '#error', content: errorContent, force: true });
          } else {
            document.body.innerHTML = '';
            document.body.appendChild(errorContent);
          }
        }
      } catch (pageError) {
        console.error('Failed to render error component:', pageError);
        console.error('Original error:', routeError.original || routeError);
      }
    }
  }

  /** 브라우저 히스토리 이벤트가 발생시 라우팅 처리 */
  private handleWindowPopstate = async () => {
    const href = window.location.href;
    await this.go(href);
  };

  /** 클릭 이벤트에서 라우터로 처리할 앵커를 찾아 클라이언트 라우팅 수행 */
  private handleRootClick = (e: MouseEvent) => {
    try {
      if (e.defaultPrevented) return;
      // middle click or modifier keys -> 원래 동작 유지
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;

      const anchor = findAnchorFromEvent(e);
      if (!anchor) return;

      // 안전 체크: 외부 사이트, 다운로드 등
      const href = anchor.getAttribute('href') || anchor.href;
      if (!href) return;
      if (isExternalUrl(href)) return; // 외부 url이면 건드리지 않음
      if (anchor.hasAttribute('download')) return;
      if (anchor.getAttribute('rel') === 'external') return;
      if (anchor.target && anchor.target !== '') return; // target 지정 시 기본 동작 유지
      
      e.preventDefault();
      // this.go가 내부에서 history 관리 및 동시성 체크를 함
      void this.go(anchor.href);
    } catch {
      // 예외는 무시하고 기본 동작 유지
    }
  };
}
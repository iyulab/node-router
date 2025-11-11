import { ErrorPage } from './components/ErrorPage.js';
import { getRandomID, absolutePath, isExternalUrl, parseUrl, findAnchorFromEvent, findOutlet, findOutletOrThrow, getRoutes, setRoutes } from './internals';
import { RouteBeginEvent, RouteDoneEvent, RouteErrorEvent, RouteError, NotFoundRouteError } from './types';
import type { RouteConfig, RouteInfo, RouterConfig } from './types';

/**
 * `lit-element`와 `react-component` 기반의 클라이언트 사이드 라우터
 */
export class Router {
  private readonly _rootElement: HTMLElement;
  private readonly _basepath: string;
  private readonly _routes: RouteConfig[];
  
  /** 현재 라우팅 요청 ID */
  private _requestID?: string;
  /** 현재 라우팅 정보 */
  private _routeInfo?: RouteInfo;

  constructor(config: RouterConfig) {
    this._rootElement = config.root;
    this._basepath = absolutePath(config.basepath || '/');
    this._routes = setRoutes(config.routes, this._basepath);

    this.waitConnected();
    window.removeEventListener('popstate', this.handleWindowPopstate);
    window.addEventListener('popstate', this.handleWindowPopstate);
    if (config.useIntercept !== false) {
      this._rootElement.removeEventListener('click', this.handleRootClick);
      this._rootElement.addEventListener('click', this.handleRootClick);
    }
  }

  /** 초기 라우팅 처리, TODO: 제거 */
  private async waitConnected() {
    let outlet = findOutlet(this._rootElement);
    let count = 0;
    while (!outlet && count < 20) {
      await new Promise(resolve => setTimeout(resolve, 50));
      outlet = findOutlet(this._rootElement);
      count++;
    }
    this.handleWindowPopstate();
  }

  /** 객체를 정리하고 이벤트 리스너를 제거합니다. */
  public destroy() {
    window.removeEventListener('popstate', this.handleWindowPopstate);
    this._rootElement.removeEventListener('click', this.handleRootClick);
    this._routeInfo = undefined;
    this._requestID = undefined;
  }

  /** 라우터의 기본 경로 반환 */
  public get basepath() {
    return this._basepath;
  }

  /** 등록된 라우트 반환 */
  public get routes() {
    return this._routes;
  }

  /** 현재 라우팅 정보 반환 */
  public get routeInfo() {
    return this._routeInfo;
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
    const routeInfo = parseUrl(href, this._basepath);
    if (routeInfo.href === this._routeInfo?.href) return;
    
    try {
      // 라우트 시작 이벤트 발생
      if(this._requestID !== requestID) return;
      window.dispatchEvent(new RouteBeginEvent(routeInfo));

      // 일치하는 라우트 찾기
      const routes = getRoutes(routeInfo.pathname, this._routes);
      const lastRoute = routes[routes.length - 1];

      //// 현재 라우트 정보 업데이트
      if (lastRoute && 'path' in lastRoute && lastRoute.path instanceof URLPattern) {
        // 인덱스 or 경로 라우트의 path URLPattern으로 params 추출
        routeInfo.params = lastRoute.path.exec({ pathname: routeInfo.pathname })?.pathname.groups || {};
      }
      this._routeInfo = routeInfo;
      window.route = routeInfo;

      // RouterError 컴포넌트로 404 에러 표시
      if(this._requestID !== requestID) return;
      if (routes.length === 0) {
        throw new NotFoundRouteError(routeInfo.href);
      }

      // Outlet 렌더링(부모 route부터 u-outlet을 찾아서 렌더링합니다.), 문서 제목 업데이트
      let outlet = findOutletOrThrow(this._rootElement);
      let title = undefined;
      for (const route of routes) {
        if(this._requestID !== requestID) return;
        const content = route.render(routeInfo);
        const element = await outlet.renderContent({ id: route.id, content: content, force: route.force });
        outlet = findOutlet(element) || outlet;
        title = route.title || title;
      }
      document.title = title || document.title;
      
      // 브라우저 히스토리 업데이트
      if(this._requestID !== requestID) return;
      if (routeInfo.href !== window.location.href) {
        window.history.pushState({ basepath: routeInfo.basepath }, '', routeInfo.href);
      } else {
        window.history.replaceState({ basepath: routeInfo.basepath }, '', routeInfo.href);
      }
      
      // 라우트 완료 이벤트 발생
      window.dispatchEvent(new RouteDoneEvent(routeInfo));
      
    } catch (error: any) {
      const routeError = new RouteError(
        error.status || error.code || 'UNKNOWN_ERROR',
        error.message || 'An unexpected error occurred',
        error
      );

      // 에러 이벤트 발생 및 콘솔 출력
      window.dispatchEvent(new RouteErrorEvent(routeError, routeInfo));
      console.error('Routing error:', error);

      // Error 컴포넌트로 에러 표시
      try {
        const errorEl = new ErrorPage();
        errorEl.error = routeError;
        document.body.innerHTML = '';
        document.body.appendChild(errorEl);
      } catch (pageError) {
        console.error('Failed to render error component:', pageError);
        console.error('Original error:', error);
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
import { absolutePath, getRandomID, parseURL } from './internals';
import { RouteBeginEvent, RouteDoneEvent, RouteErrorEvent, RouteError, NotFoundRouteError } from './types';
import { ErrorPage } from './components/ErrorPage.js';

import type { RouteConfig, RouteInfo, RouterConfig } from './types';
import type { Outlet } from './components';

export class Router {
  private readonly _rootElement: HTMLElement;
  private readonly _basepath: string;
  private readonly _routes: RouteConfig[];
  
  /** 현재 라우팅 요청 ID */
  private _requestID?: string;
  /** 현재 라우팅 정보 */
  private _routeInfo?: RouteInfo;
  /** 현재 라우팅 시도 카운터 */
  private _counter: number = 0;

  constructor(config: RouterConfig) {
    this._rootElement = config.root;
    this._basepath = absolutePath(config.basepath || '/');
    this._routes = this.setRoutes(config.routes, this._basepath);

    window.removeEventListener('popstate', this.handlePopstate);
    window.addEventListener('popstate', this.handlePopstate);
    this.initiate();
  }

  public get basepath() {
    return this._basepath;
  }
  public get routes() {
    return this._routes;
  }
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
    const routeInfo = parseURL(href, this._basepath);
    if (routeInfo.href === this._routeInfo?.href) return;
    
    try {
      // 라우트 시작 이벤트 발생
      if(this._requestID !== requestID) return;
      window.dispatchEvent(new RouteBeginEvent(routeInfo));

      // 일치하는 라우트 찾기
      const routes = this.getRoutes(routeInfo.pathname);
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
      let outlet = this.findOutletOrThrow(this._rootElement);
      let title = undefined;
      for (const route of routes) {
        if(this._requestID !== requestID) return;
        const content = route.render(routeInfo);
        const element = await outlet.renderContent({ id: route.id, content: content, force: route.force });
        outlet = this.findOutlet(element) || outlet;
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

  /** 초기 라우팅 처리, TODO: 제거 */
  private async initiate() {
    let outlet = await this.findOutlet(this._rootElement);
    while (!outlet && this._counter < 20) {
      await new Promise(resolve => setTimeout(resolve, 50));
      this._counter++;
      outlet = await this.findOutlet(this._rootElement);
    }
    this._counter = 0;
    this.handlePopstate();
  }

  /** 브라우저 히스토리 이벤트가 발생시 라우팅 처리 */
  private handlePopstate = async () => {
    const href = window.location.href;
    await this.go(href);
  };

  /** 라우트를 재설정합니다. */
  private setRoutes(routes: RouteConfig[], basepath: string) {
    for (const route of routes) {
      route.id ||= getRandomID();
      
      if ('index' in route && route.index) {
        // 인덱스 라우트는 현재 basepath를 URLPattern으로 설정
        route.path = new URLPattern({ pathname: `${basepath}{/}?` });
      } else if ('path' in route && route.path) {
        // 경로 라우트 처리 - string이면 URLPattern으로 변환
        if (typeof route.path === 'string') {
          const absolutePathStr = absolutePath(basepath, route.path);
          route.path = new URLPattern({ pathname: `${absolutePathStr}{/}?` });
        }
      } else {
        throw new Error('Route must have either "index" or "path" property defined.');
      }

      if (route.children && route.children.length > 0) {
        let childBasepath: string;
        if ('index' in route) {
          // 인덱스 라우트는 현재 basepath를 그대로 사용
          childBasepath = basepath;
        } else {
          // 경로 라우트는 해당 경로를 자식의 basepath로 사용
          if (typeof route.path === 'string') {
            childBasepath = absolutePath(basepath, route.path);
          } else {
            // URLPattern에서 pathname 추출
            childBasepath = route.path.pathname.replace('{/}?', '');
          }
        }
        route.children = this.setRoutes(route.children, childBasepath);
        route.force ||= false;
      } else {
        route.force ||= true;
      }
    }
    return routes;
  }

  /** URLPattern을 사용하여 경로와 일치하는 라우트들을 자식 라우트까지 포함하여 반환합니다. */
  private getRoutes(pathname: string, routes: RouteConfig[] = this._routes): RouteConfig[] {
    for (const route of routes) {
      if (route.children) {
        const childRoutes = this.getRoutes(pathname, route.children);
        if (childRoutes.length > 0) {
          return [route, ...childRoutes];
        }
      }
      
      // 라우트 매칭 확인
      let matches = false;
      if ('index' in route && route.index && route.path) {
        // 인덱스 라우트는 설정된 path URLPattern으로 테스트
        matches = route.path.test({ pathname: pathname });
      } else if ('path' in route && route.path instanceof URLPattern) {
        matches = route.path.test({ pathname: pathname });
      }
      
      if (matches) {
        return [route];
      }
    }
    return [];
  }

  /** Outlet 엘리먼트를 찾아 반환합니다. */
  private findOutlet(element: HTMLElement): Outlet | undefined {
    let outlet: Outlet | undefined = undefined;

    if (element.shadowRoot) {
      // Shadow DOM에서 찾기
      outlet = element.shadowRoot.querySelector('u-outlet') as Outlet;
      if (outlet) return outlet;

      for (const child of Array.from(element.shadowRoot.children)) {
        outlet = this.findOutlet(child as HTMLElement);
        if (outlet) return outlet;
      }
    } else {
      // 일반 DOM에서 찾기
      outlet = element.querySelector('u-outlet') as Outlet;
      if (outlet) return outlet;

      for (const child of Array.from(element.children)) {
        outlet = this.findOutlet(child as HTMLElement);
        if (outlet) return outlet;
      }
    }

    // 없으면 undefined 반환
    return undefined;
  }

  /** Outlet 엘리먼트를 찾아 반환합니다. 없으면 에러를 던집니다. */
  private findOutletOrThrow(element: HTMLElement): Outlet {
    const outlet = this.findOutlet(element);
    if (!outlet) {
      throw new Error('No Outlet component found in the root element.');
    }
    return outlet;
  }
}
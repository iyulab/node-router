import { LitElement } from 'lit';

import { absolutePath, getRandomID, parseURL } from './internals';
import type { RouteConfig, RouteInfo, RouterConfig, RouteError } from './types';
import { RouteStartEvent, RouteEndEvent, RouteErrorEvent } from './types';
import { type Outlet, ErrorPage } from './components';

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

  public get basepath() {
    return this._basepath;
  }
  public get routeInfo() {
    return this._routeInfo;
  }

  constructor(config: RouterConfig) {
    this._rootElement = config.root;
    this._basepath = absolutePath(config.basepath || '/');
    this._routes = this.setRoutes(config.routes, this._basepath);

    window.removeEventListener('popstate', this.handlePopstate);
    window.addEventListener('popstate', this.handlePopstate);
    this.handlePopstate();
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
    
    if(this._requestID !== requestID) return;
    
    // 라우트 시작 이벤트 발생
    window.dispatchEvent(new RouteStartEvent(routeInfo));

    try {
      // 일치하는 라우트 찾기
      const routes = this.getRoutes(routeInfo.pathname);
      const lastRoute = routes[routes.length - 1];
      if(this._requestID !== requestID) return;

      // 데이터 로딩 및 라우팅 정보 업데이트
      routeInfo.params = lastRoute?.pattern?.exec({ pathname: routeInfo.pathname })?.pathname.groups || {};
      if (typeof lastRoute?.loader === 'function') {
        routeInfo.data = await lastRoute.loader(routeInfo);
      }
      if(this._requestID !== requestID) return;
      
      this._routeInfo = routeInfo;
      
      // window.route에 현재 라우트 정보 설정
      window.route = routeInfo;
      
      // Outlet 렌더링(부모 route부터 u-outlet을 찾아서 렌더링합니다.)
      let outlet = await this.findOutlet(this._rootElement);
      if (routes.length === 0) {
        if(this._requestID !== requestID) return;
        
        // RouterError 컴포넌트로 404 에러 표시
        throw new Error(`No route matched for path: ${routeInfo.pathname}`);
      } else {
        for (const route of routes) {
          if(this._requestID !== requestID) return;
          if(route.element) {
            const element = await outlet.renderElement({ id: route.id, element: route.element, force: route.force });
            outlet = element?.shadowRoot?.querySelector('u-outlet') || outlet;
          } else if (route.component) {
            const component = await outlet.renderComponent({ id: route.id, component: route.component, force: route.force });
            outlet = component?.querySelector('u-outlet') || outlet;
          } else {
            // 라우트 설정 오류
            throw new Error(`Route "${route.path}" has no element or component defined.`);
          }
        }
        
        // 브라우저 히스토리 및 라우트 완료 이벤트 발생
        if(this._requestID !== requestID) return;
        if (routeInfo.href !== window.location.href) {
          window.history.pushState({ basepath: routeInfo.basepath }, '', routeInfo.href);
        } else {
          window.history.replaceState({ basepath: routeInfo.basepath }, '', routeInfo.href);
        }
        document.title = lastRoute?.title || document.title;
        
        // 라우트 완료 이벤트 발생
        window.dispatchEvent(new RouteEndEvent(routeInfo));
      }
      
    } catch (error: any) {
      const routeError: RouteError = {
        code: error.status || error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        path: routeInfo?.pathname,
        original: error,
        timestamp: new Date().toISOString()
      };

      // 에러 이벤트 발생
      window.dispatchEvent(new RouteErrorEvent(routeError, routeInfo));

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
  private handlePopstate = async () => {
    const href = window.location.href;
    await this.go(href);
  };

  /** 라우트를 재설정합니다. */
  private setRoutes(routes: RouteConfig[], basepath: string) {
    for (const route of routes) {
      route.id ||= getRandomID();
      if (route.index)
        route.path = '';
      
      if (route.path)
        route.path = absolutePath(basepath, route.path);

      if (route.path && !route.pattern)
        route.pattern = new URLPattern({ pathname: `${route.path}{/}?` });

      if (route.children && route.children.length > 0 && route.path) {
        route.children = this.setRoutes(route.children, route.path);
        route.force ||= false;
      } else {
        route.force ||= true;
      }

      if (!route.pattern)
        throw new Error(`Route path is required: ${JSON.stringify(route)}`);
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
      
      if (route.pattern?.test({ pathname: pathname })) {
        return [route];
      }
    }
    return [];
  }

  /** Outlet 엘리먼트를 찾아 반환합니다. */
  private async findOutlet(element: HTMLElement): Promise<Outlet> {
    let outlet = element.querySelector('u-outlet') as Outlet;
    if (!outlet && element.shadowRoot) {
      if (element instanceof LitElement) {
        await element.updateComplete;
      }
      outlet = element.shadowRoot.querySelector('u-outlet') as Outlet;
    }

    // Outlet이 아직 렌더링되지 않은 경우 잠시 대기 후 다시 시도
    // 주의: 무한루프에 빠지지 않도록 주의해야 합니다.
    // TODO: 타임아웃 처리 추가 고려
    if (!outlet) {
      if (this._counter > 100)
        throw new Error('Outlet element not found.');

      this._counter++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return this.findOutlet(element);
    }
    this._counter = 0;
    return outlet;
  }
}
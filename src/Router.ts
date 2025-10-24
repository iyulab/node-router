import type { LitElement } from 'lit';
import type { Route, RouteInfo, RouterConfig } from './types';
import type { UOutlet } from './components/Outlet';
import { combinePath, getRandomID, parseURL } from './Utils';

export class Router {
  private readonly _rootElement: HTMLElement;
  private readonly _notfound: typeof LitElement | string;
  private readonly _basepath: string;
  private readonly _routes: Route[];
  private _routeInfo?: RouteInfo;
  private requestID?: string;
  private _polyfillLoaded = false;

  public get basepath() {
    return this._basepath;
  }
  public get routeInfo() {
    return this._routeInfo;
  }

  constructor(config: RouterConfig) {
    this._rootElement = config.root;
    this._notfound = config.notfound;
    this._basepath = combinePath(config.basepath || '/');
    this._routes = this.setRoutes(config.routes, this._basepath);
    this.loadPolyfillIfNeeded();
  }

  /**
   * URLPattern 폴리필을 필요시 로드
   */
  private async loadPolyfillIfNeeded() {
    // @ts-ignore: Property 'URLPattern' does not exist on type 'typeof globalThis'
    if (!globalThis.URLPattern && !this._polyfillLoaded) {
      try {
        await import("urlpattern-polyfill");
        this._polyfillLoaded = true;
      } catch (error) {
        console.error('Failed to load URLPattern polyfill:', error);
      }
    }
  }

  /**
   * 라우터 연결
   */
  public connect() {
    window.addEventListener('popstate', this.onPopstate);
    this.onPopstate();
  }

  /**
   * 라우터 연결 해제
   */
  public disconnect() {
    window.removeEventListener('popstate', this.onPopstate);
  }

  /**
   * 지정한 경로로 이동
   * - 클라이언트 사이드 라우팅을 수행합니다.
   * - 상대경로일 경우 basepath와 조합되어 이동합니다.
   * - 라우터에 포함되지 않은 경로로 이동할 경우 다른 방법으로 처리하세요.
   * @param href 이동할 경로
   */
  public async go(href: string) {
    // URLPattern 폴리필 확인
    await this.loadPolyfillIfNeeded();
    
    // 요청 ID 생성
    const requestID = getRandomID();
    this.requestID = requestID;

    // URL 분석
    const routeInfo = parseURL(href, this._basepath);
    if (routeInfo.href === this._routeInfo?.href) return;
    if(this.requestID !== requestID) return;
    this.dispatchProgress(0.1);

    // 일치하는 라우트 찾기
    const routes = this.getRoutes(routeInfo.pathname);
    const lastRoute = routes[routes.length - 1];
    if(this.requestID !== requestID) return;
    this.dispatchProgress(0.3);

    // 데이터 로딩 및 라우팅 정보 업데이트
    this.ensurePattern(lastRoute);
    routeInfo.params = lastRoute?.pattern?.exec({ pathname: routeInfo.pathname })?.pathname.groups || {};
    if (typeof lastRoute?.loader === 'function') {
      try {
        routeInfo.data = await lastRoute.loader(routeInfo);
      } catch (error) {
        console.error(error);
      }
    }
    if(this.requestID !== requestID) return;
    this.dispatchProgress(0.5);
    this._routeInfo = routeInfo;
    
    // Outlet 렌더링(부모 route부터 u-outlet을 찾아서 렌더링합니다.)
    let outlet = this.getOutlet(this._rootElement);
    if (!outlet) {
      console.error('Outlet element not found in root element');
    } else if (routes.length === 0) {
      if(this.requestID !== requestID) return;
      this.dispatchProgress(1);
      this._notfound ? outlet.renderElement({ element: this._notfound }) : outlet.clearRoot();
    } else {
      for (const route of routes) {
        if(this.requestID !== requestID) return;
        this.dispatchProgress(0.5 + 0.5 * ((routes.indexOf(route) + 1) / routes.length));
        if(route.element) {
          const element = await outlet.renderElement({ id: route.id, element: route.element, force: route.force });
          outlet = element?.shadowRoot?.querySelector('u-outlet') || outlet;
        } else if (route.component) {
          const component = await outlet.renderComponent({ id: route.id, component: route.component, force: route.force });
          outlet = component?.querySelector('u-outlet') || outlet;
        } else if (this._notfound) {
          await outlet.renderElement({ element: this._notfound });
        } else {
          outlet.clearRoot();
        }
      }
    }
    
    // 브라우저 히스토리 및 이벤트 발생
    if(this.requestID !== requestID) return;
    if (routeInfo.href !== window.location.href) {
      window.history.pushState({ basepath: routeInfo.basepath }, '', routeInfo.href);
    } else {
      window.history.replaceState({ basepath: routeInfo.basepath }, '', routeInfo.href);
    }
    document.title = lastRoute?.title || document.title;
    document.dispatchEvent(new CustomEvent('route-change', { detail: routeInfo }));
  }

  /**
   * 라우터 기본 경로로 이동
   */
  public async goBase() {
    await this.go(this._routeInfo?.basepath || this._basepath);
  }

  /**
   * 라우트 URLPattern 생성
   */
  private setRoutes(routes: Route[], basepath: string) {
    for (const route of routes) {
      route.id ||= getRandomID();
      route.path = route.index ? '' : route.path;
      route.path = combinePath(basepath, route.path);
      // URLPattern은 런타임에 생성되므로 여기서는 생성하지 않음
      if (route.children && route.children.length > 0) {
        route.children = this.setRoutes(route.children, route.path);
        route.force ||= false;
      } else {
        route.force ||= true;
      }
    }
    return routes;
  }

  /**
   * URLPattern을 필요할 때 동적으로 생성
   */
  private ensurePattern(route: Route) {
    if (!route.pattern && route.path !== undefined) {
      // @ts-ignore: Property 'URLPattern' does not exist on type 'typeof globalThis'
      route.pattern = new globalThis.URLPattern({ pathname: `${route.path}{/}?` });
    }
  }

  /**
   * 경로와 일치하는 라우트를 찾습니다.
   * URLPattern을 사용하여 경로를 비교하고 재귀적으로 자식 라우트도 검색합니다.
   */
  private getRoutes(pathname: string, routes: Route[] = this._routes): Route[] {
    for (const route of routes) {
      if (route.children) {
        const childRoutes = this.getRoutes(pathname, route.children);
        if (childRoutes.length > 0) {
          return [route, ...childRoutes];
        }
      }
      this.ensurePattern(route);
      if (route.pattern?.test({ pathname: pathname })) {
        return [route];
      }
    }
    return [];
  }

  /**
   * 라우팅 진행률 Dispatch
   */
  private dispatchProgress(value: number) {
    document.dispatchEvent(new CustomEvent('route-progress', { detail: value })); 
  }

  /**
   * 브라우저 히스토리 이벤트가 발생했을 때 라우팅 처리
   */
  private onPopstate = async () => {
    const href = window.location.href;
    await this.go(href);
  };

  /**
   * Outlet 엘리먼트를 찾습니다.
   */
  private getOutlet(element: HTMLElement): UOutlet | null | undefined {
    let outlet = element.querySelector('u-outlet') as UOutlet;
    if (!outlet && element.shadowRoot) {
      outlet =  element.shadowRoot.querySelector('u-outlet') as UOutlet;
    }
    return outlet;
  }
  
}
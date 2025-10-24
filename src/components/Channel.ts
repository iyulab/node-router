import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { createElement } from "react";
import type { RouteInfo } from '../types';

/**
 * Lit 컴포넌트에서 라우트 정보를 제공하는 베이스 클래스
 * 이 클래스를 상속받아 routeInfo 속성을 사용할 수 있습니다.
 * 주의: Router 인스턴스가 전역 변수로 설정되어야 합니다.
 */
@customElement('lit-channel')
export class LitChannel extends LitElement {
  protected routeInfo?: RouteInfo;
  
  constructor() {
    super();
    this.updateRouteInfo();
    document.addEventListener('route-change', this.handleRouteChange);
  }

  disconnectedCallback() {
    document.removeEventListener('route-change', this.handleRouteChange);
    super.disconnectedCallback();
  }

  private handleRouteChange = (event: Event) => {
    const customEvent = event as CustomEvent;
    this.routeInfo = customEvent.detail;
    this.requestUpdate();
  };

  private updateRouteInfo() {
    // 전역 라우터 인스턴스에서 routeInfo를 가져옵니다.
    // 실제 구현에서는 Router 인스턴스를 전역으로 접근할 수 있는 방법이 필요합니다.
    this.routeInfo = (window as any).routerInstance?.routeInfo;
  }
}

/**
 * React 컴포넌트에서 라우트 정보를 제공하는 HOC
 * @param ReactComponent 라우트 정보를 props로 받을 React 컴포넌트
 * @returns 라우트 정보가 주입된 React 컴포넌트
 */
export function ReactChannel(ReactComponent: React.ComponentType<RouteInfo>) {
  return function WithReactComponent() {
    // 전역 라우터 인스턴스에서 routeInfo를 가져옵니다.
    // 실제 구현에서는 Router 인스턴스를 전역으로 접근할 수 있는 방법이 필요합니다.
    const routeInfo: RouteInfo | undefined = (window as any).routerInstance?.routeInfo;
    return createElement(ReactComponent, routeInfo);
  }
}
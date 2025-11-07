/** 
 * vite-plugin-dts 설정의 rollupTypes 옵션에서 global 선언을 인식하지 못하는 문제로
 * global 선언 파일은 따로 분리하여 관리합니다.
 */

import { RouteBeginEvent, RouteDoneEvent, RouteErrorEvent } from './types/RouteEvent';
import { RouteInfo } from './types/RouteInfo';
import { Link, Outlet } from './components';

/* === EXTRACT === */
declare global {
  interface WindowEventMap {
    'route-begin': RouteBeginEvent;
    'route-done': RouteDoneEvent;
    'route-error': RouteErrorEvent;
  }

  interface Window {
    route: RouteInfo;
  }

  interface HTMLElementTagNameMap {
    'u-link': Link;
    'u-outlet': Outlet;
  }
}
/* === EXTRACT === */

export {};
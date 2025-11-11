/** 
 * vite-plugin-dts 설정의 rollupTypes 옵션에서 global 선언을 인식하지 못하는 문제로
 * 빌드에 포함될 global 선언 파일은 따로 분리하여 관리합니다.
 * **EXTRACT** 주석으로 감싸진 부분이 빌드 시에만 포함됩니다.
 */

import { RouteBeginEvent, RouteDoneEvent, RouteErrorEvent } from './types/RouteEvent';
import { RouteInfo } from './types/RouteInfo';
import { Link, Outlet } from './components';

/* === EXTRACT === */
declare global {
  interface Window {
    route: RouteInfo;
  }

  interface WindowEventMap {
    'route-begin': RouteBeginEvent;
    'route-done': RouteDoneEvent;
    'route-error': RouteErrorEvent;
  }

  interface HTMLElementTagNameMap {
    'u-link': Link;
    'u-outlet': Outlet;
  }
}
/* === EXTRACT === */

export {};
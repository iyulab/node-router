import type { RouteBeginEvent, RouteProgressEvent, RouteDoneEvent, RouteErrorEvent } from './types/RouteEvent';

/** 
 * 전역 WindowEventMap에 라우터 이벤트 타입 
 */
declare global {
  interface WindowEventMap {
    'route-begin': RouteBeginEvent;
    'route-progress': RouteProgressEvent;
    'route-done': RouteDoneEvent;
    'route-error': RouteErrorEvent;
  }
}

export {};

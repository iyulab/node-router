import type { RouteInfo } from './RouteInfo';
import type { RouteError } from './RouteError';

/** 라우터 이벤트 기본 클래스 */
export abstract class RouteEvent extends Event {
  
  /** 라우팅 정보 */
  public readonly routeInfo: RouteInfo;
  /** 이벤트 발생 시간 */
  public readonly timestamp: string;

  constructor(type: string, routeInfo:RouteInfo, cancelable: boolean = false) {
    super(type, { bubbles: true, composed: true, cancelable });
    this.routeInfo = routeInfo;
    this.timestamp = new Date().toISOString();
  }

  /** 이벤트가 취소되었는지 확인 */
  public get cancelled(): boolean {
    return this.defaultPrevented;
  }

  /** 이벤트 취소 */
  public cancel(): void {
    if (this.cancelable) {
      this.preventDefault();
    }
  }
}

/**
 * 라우트 시작 이벤트
 */
export class RouteStartEvent extends RouteEvent {
  constructor(routeInfo: RouteInfo) {
    super('route-start', routeInfo, false);
  }
}

/**
 * 라우트 완료 이벤트
 */
export class RouteEndEvent extends RouteEvent {
  constructor(routeInfo: RouteInfo) {
    super('route-end', routeInfo, false);
  }
}

/**
 * 라우트 에러 이벤트
 */
export class RouteErrorEvent extends RouteEvent {
  
  /** 에러 정보 */
  public readonly error: RouteError;

  constructor(
    error: RouteError,
    routeInfo: RouteInfo
  ) {
    super('route-error', routeInfo, false);
    this.error = error;
  }
}
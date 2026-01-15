import type { RouteContext } from './RouteContext';
import { RouteError } from './RouteError';

/** 라우터 이벤트 기본 클래스 */
abstract class RouteEvent extends Event {
  
  /** 라우팅 정보 */
  public readonly context: RouteContext;
  /** 이벤트 발생 시간 */
  public readonly timestamp: string;

  constructor(type: string, context: RouteContext, cancelable: boolean = false) {
    super(type, { bubbles: true, composed: true, cancelable });
    this.context = context;
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
export class RouteBeginEvent extends RouteEvent {
  constructor(context: RouteContext) {
    super('route-begin', context, false);
  }
}

/**
 * 라우트 진행 이벤트
 */
export class RouteProgressEvent extends RouteEvent {

  /** 진행 상태 값 (0~100) */
  public readonly progress: number;

  constructor(context: RouteContext, progress: number) {
    super('route-progress', context, false);
    this.progress = progress;
  }
}

/**
 * 라우트 완료 이벤트
 */
export class RouteDoneEvent extends RouteEvent {
  constructor(context: RouteContext) {
    super('route-done', context, false);
  }
}

/**
 * 라우트 에러 이벤트
 */
export class RouteErrorEvent extends RouteEvent {
  
  /** 에러 정보 */
  public readonly error: RouteError;

  constructor(context: RouteContext, error: RouteError) {
    super('route-error', context, false);
    this.error = error;
  }
}
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { currentRouteUrl, requestRoutedNavigation, stateMode, toBrowserHref, ROUTER_STATE_EVENT, type NavigationRequestOutcome } from './internals/location.js';

/**
 * 선택 채널의 선택 사항.
 */
export interface SelectionOptions<T> {
  /**
   * 주소의 쿼리 키 — 주면 값이 주소에 남는다(딥링크 · 공유 · 뒤로 가기). 주소가 원천이 되어, 다른 탭에서 연 링크나
   * Back 으로 돌아온 항목의 값이 채널에 들어온다. 주지 않으면 이 문서 안의 값일 뿐이다.
   */
  query?: string;
  /** 쿼리 글자 → 값. 기본은 글자 그대로. `undefined` 를 돌려주면 «선택 없음». */
  parse?: (raw: string) => T | undefined;
  /** 값 → 쿼리 글자. 기본 `String(value)`. */
  format?: (value: T) => string;
  /**
   * 선택이 바뀔 때 주소를 어떻게 남기는가 — `'replace'`(기본: 선택을 바꿀 때마다 기록이 쌓이지 않는다) ·
   * `'push'`(선택 하나가 기록 항목 하나 — Back 이 앞 선택으로 돌아간다).
   */
  history?: 'replace' | 'push';
}

/** 구독자 — 값과, 그 값이 유효한 동안만 살아 있는 신호(다음 선택이 오면 중단된다 — 늦은 응답 버리기). */
export type SelectionListener<T> = (value: T | undefined, signal: AbortSignal) => void;

/** 한 뷰의 따라가기 — 고정하면 채널이 바뀌어도 그 뷰는 멈춰 있고, 풀면 지금 값으로 다시 맞춘다. */
export interface SelectionFollower {
  readonly pinned: boolean;
  pin(): void;
  unpin(): void;
  dispose(): void;
}

/**
 * 이름 있는 선택 채널 — 여러 뷰(목록 · 곁 패널 · 열린 탭)가 «지금 고른 것» 하나를 함께 따라간다.
 *
 * 이동이 «어느 화면인가» 라면 선택은 «그 화면 안에서 지금 무엇을 보는가» 다. 같은 이름의 채널은 문서에 하나뿐이라,
 * 서로 모르는 모듈이 이름으로 같은 선택을 공유한다.
 */
export interface SelectionChannel<T> {
  readonly name: string;
  /** 지금 값(선택 없음이면 `undefined`). */
  readonly value: T | undefined;
  /** 지금 값이 유효한 동안의 신호 — 이 값으로 시작한 비동기 작업에 넘긴다. */
  readonly signal: AbortSignal;
  /** 선택을 바꾼다. `query` 가 있으면 주소에도 남긴다(`history`). */
  set(value: T | undefined): void;
  /** 바뀔 때마다 부른다. `immediate` 면 지금 값으로 한 번 먼저. 해지 함수를 돌려준다. */
  subscribe(listener: SelectionListener<T>, options?: { immediate?: boolean }): () => void;
  /** 고정할 수 있는 구독 — 뷰마다 «따라가기 / 고정». 지금 값으로 한 번 먼저 부른다. */
  follow(listener: SelectionListener<T>): SelectionFollower;
}

const channels = new Map<string, Channel<unknown>>();

/**
 * 이름 있는 선택 채널을 얻는다 — 같은 이름이면 같은 채널이다(선택 사항은 처음 만든 쪽의 것).
 *
 * ```ts
 * const order = selection<string>('order', { query: 'order' });
 * order.subscribe((id, signal) => id && load(id, { signal }));   // 늦은 응답은 signal 로 버린다
 * order.set('G-7');                                              // 주소 ?order=G-7 · 구독자 전부
 * ```
 */
export function selection<T>(name: string, options: SelectionOptions<T> = {}): SelectionChannel<T> {
  let channel = channels.get(name) as Channel<T> | undefined;
  if (!channel) {
    channel = new Channel<T>(name, options);
    channels.set(name, channel as Channel<unknown>);
  }
  return channel;
}

class Channel<T> implements SelectionChannel<T> {
  private _value: T | undefined;
  private controller = new AbortController();
  private readonly listeners = new Set<SelectionListener<T>>();

  constructor(readonly name: string, private readonly options: SelectionOptions<T>) {
    if (options.query) {
      this._value = this.fromAddress();
      // 주소가 원천 — 뒤로·앞으로 가기, 딥링크, 다른 코드의 이동으로 쿼리가 바뀌면 채널이 따라간다.
      // 라우터보다 먼저 만든 채널은 모드(hash 면 `#` 뒤가 주소)를 모른 채 읽었다 — 라우터가 상태를 적으면 다시 읽는다.
      // 라우터가 쓴 항목으로의 뒤로·앞으로 가기는 라우터가 `leave` 에 묻고 나서 `route-begin` 을 낸다 — 거기서 따라간다
      // (막힌 이동에 채널이 먼저 움직이면 따라가는 뷰가 버려질 선택을 불러온다).
      window.addEventListener('popstate', this.syncFromUnroutedEntry);
      window.addEventListener('route-begin', this.syncFromAddress);
      window.addEventListener(ROUTER_STATE_EVENT, this.syncFromAddress);
    }
  }

  get value(): T | undefined {
    return this._value;
  }

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  set(value: T | undefined): void {
    if (this.same(this._value, value)) return;
    if (!this.options.query) {
      this.change(value);
      return;
    }
    // 떠 있는 라우터가 받은 이동이 화면의 `leave` 에 막히면 채널도 그대로다. 가드가 아직 답하는 중이면(대화상자) 값은 그
    // 이동이 시작될 때(`route-begin`) 바뀐다. 바로 통과면(종전처럼) 지금 바꾼다. 라우터가 없으면 지금 바꾸고 기록만 고친다.
    const outcome = this.toAddress(value);
    if (outcome.leave !== 'allowed') return;
    this.change(value);
    if (!outcome.handled) this.writeHistory(value);
  }

  subscribe(listener: SelectionListener<T>, options?: { immediate?: boolean }): () => void {
    this.listeners.add(listener);
    if (options?.immediate) listener(this._value, this.controller.signal);
    return () => this.listeners.delete(listener);
  }

  follow(listener: SelectionListener<T>): SelectionFollower {
    let pinned = false;
    const unsubscribe = this.subscribe((value, signal) => {
      if (!pinned) listener(value, signal);
    }, { immediate: true });
    return {
      get pinned() { return pinned; },
      pin: () => { pinned = true; },
      unpin: () => {
        if (!pinned) return;
        pinned = false;
        listener(this._value, this.controller.signal);
      },
      dispose: unsubscribe,
    };
  }

  /** 값을 바꾸고 알린다 — 같은 값이면 아무것도 하지 않는다. */
  private change(value: T | undefined): boolean {
    if (this.same(this._value, value)) return false;
    this._value = value;
    this.controller.abort();
    this.controller = new AbortController();
    const signal = this.controller.signal;
    for (const listener of [...this.listeners]) listener(value, signal);
    return true;
  }

  /** 주소 표현으로 같은가 — 객체 값도 같은 글자면 같은 선택이다. */
  private same(a: T | undefined, b: T | undefined): boolean {
    if (a === b) return true;
    if (a === undefined || b === undefined) return false;
    return this.format(a) === this.format(b);
  }

  private format(value: T): string {
    return this.options.format ? this.options.format(value) : String(value);
  }

  private fromAddress(): T | undefined {
    const raw = currentRouteUrl(stateMode()).searchParams.get(this.options.query!);
    if (raw === null) return undefined;
    return this.options.parse ? this.options.parse(raw) : (raw as unknown as T);
  }

  private syncFromAddress = () => {
    this.change(this.fromAddress());
  };

  /** 라우터가 쓰지 않은 항목으로의 뒤로·앞으로 가기만 바로 따라간다(라우터 항목은 `route-begin` 이 맡는다). */
  private syncFromUnroutedEntry = () => {
    const state = window.history.state as { entryKey?: unknown } | null;
    if (typeof state?.entryKey === 'string') return;
    this.syncFromAddress();
  };

  /** 이 값을 담은 주소 — 지금 주소의 쿼리만 바꾼다. */
  private addressOf(value: T | undefined): { routePath: string; href: string } {
    const mode = stateMode();
    const url = currentRouteUrl(mode);
    if (value === undefined) url.searchParams.delete(this.options.query!);
    else url.searchParams.set(this.options.query!, this.format(value));
    const routePath = url.pathname + url.search + url.hash;
    return { routePath, href: toBrowserHref(routePath, url.href, mode) };
  }

  /** 떠 있는 라우터에 주소 변경을 맡긴다(같은 화면이면 `RouteConfig.key` 로 재마운트를 피한다). */
  private toAddress(value: T | undefined): NavigationRequestOutcome {
    return requestRoutedNavigation(this.addressOf(value).routePath, { replace: this.options.history !== 'push' });
  }

  /** 라우터가 없을 때 — 문서를 떠나지 않고 기록만 고친다. */
  private writeHistory(value: T | undefined): void {
    const { href } = this.addressOf(value);
    if (this.options.history !== 'push') window.history.replaceState(window.history.state, '', href);
    else window.history.pushState(window.history.state, '', href);
  }
}

/**
 * Lit 요소에서 선택 채널을 따라가는 컨트롤러 — 연결된 동안 구독하고 값이 바뀌면 다시 그린다.
 *
 * ```ts
 * private order = new SelectionController(this, selection<string>('order', { query: 'order' }));
 * render() { return html`${this.order.value ?? 'none'}`; }
 * ```
 */
export class SelectionController<T> implements ReactiveController {
  private follower?: SelectionFollower;
  private _value: T | undefined;
  private _signal: AbortSignal;

  constructor(private readonly host: ReactiveControllerHost, readonly channel: SelectionChannel<T>) {
    this._value = channel.value;
    this._signal = channel.signal;
    host.addController(this);
  }

  /** 이 뷰가 보는 값 — 고정 중이면 고정한 때의 값. */
  get value(): T | undefined {
    return this._value;
  }

  get signal(): AbortSignal {
    return this._signal;
  }

  get pinned(): boolean {
    return this.follower?.pinned ?? false;
  }

  pin(): void {
    this.follower?.pin();
    this.host.requestUpdate();
  }

  unpin(): void {
    this.follower?.unpin();
    this.host.requestUpdate();
  }

  hostConnected(): void {
    this.follower = this.channel.follow((value, signal) => {
      this._value = value;
      this._signal = signal;
      this.host.requestUpdate();
    });
  }

  hostDisconnected(): void {
    this.follower?.dispose();
    this.follower = undefined;
  }
}

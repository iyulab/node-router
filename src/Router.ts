import { UErrorPage } from './components/UErrorPage.js';
import { UOutlet } from './components/UOutlet.js';
import { getRandomID } from './internals/crypto-helpers.js';
import { findOutlet, findOutletOrThrow, findAnchorFrom, waitOutlet } from './internals/element-helpers.js';
import { getRoutes, setRoutes  } from './internals/route-helpers.js';
import { absolutePath, isExternalUrl, parseUrl } from './internals/url-helpers.js';
import { currentRouteUrl, toBrowserHref, toRouteHref, ROUTER_STATE_EVENT, ROUTER_NAVIGATE_EVENT, type RouterMode, type RouterNavigateRequest, type LeaveOutcome } from './internals/location.js';
import { RouteTracker } from './internals/RouteTracker.js';
import { ScrollMemory } from './internals/ScrollMemory.js';
import { AccessDeniedError, ContentLoadError, ContentRenderError, NotFoundError, RouteError } from './types/RouteError.js';
import { RouteBeginEvent, RouteDoneEvent, RouteErrorEvent, RouteProgressEvent } from './types/RouteEvent.js';
import type { RouteContext, RouteLeaveContext, RouteNavigationType } from './types/RouteContext.js';
import type { RouterConfig } from './types/RouterConfig.js';
import type { FallbackRouteConfig, RouteConfig } from './types/RouteConfig.js';
import type { NavigateOptions } from './types/NavigateOptions.js';

/**
 * 실패가 «예상된 결과» 인가 — 상태 코드가 4xx 인 것(없는 경로 404 · 가드 거부 403 · 가드가 던진 `{ status: 401 }` 류).
 * 판정은 클래스가 아니라 코드로 한다: 가드가 던진 상태도 router 가 같은 코드의 `RouteError` 로 감싼다.
 */
function isExpectedOutcome(error: RouteError): boolean {
  const code = Number(error.code);
  return Number.isInteger(code) && code >= 400 && code < 500;
}

/**
 * 첫 라우팅의 이동 종류 — 문서가 어떻게 열렸는가(Navigation Timing). 새로 고침이면 `reload`, 뒤로·앞으로 가기로 문서가
 * 다시 열렸으면 `traverse`, 그 밖은 새 방문(`push`).
 */
function initialNavigationType(): RouteNavigationType {
  const entry = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (entry?.type === 'reload') return 'reload';
  if (entry?.type === 'back_forward') return 'traverse';
  return 'push';
}

/** `history.state` 가 펼칠 수 있는 평범한 객체인가 — 다른 코드가 원시값·배열을 넣었으면 잇지 않는다. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 화면을 바꾸는 이동인가 — 경로나 쿼리가 다르면. 해시만 다른 이동은 같은 화면 안이다. */
function leavesScreen(from: RouteContext, to: RouteContext): boolean {
  const strip = (href: string) => href.split('#')[0];
  return strip(from.href) !== strip(to.href);
}

/** 되돌린 뒤로·앞으로 가기의 `popstate` 를 이만큼 기다린다 — 오지 않으면(브라우저가 이동을 버렸으면) 그냥 묻는다. */
const REVERT_TIMEOUT = 1_000;

/**
 * `lit-element`, `react`를 지원하는 SPA 클라이언트 라우터 객체입니다.
 */
export class Router {
  private readonly _rootElement: HTMLElement;
  private readonly _basepath: string;
  private readonly _routes: RouteConfig[];
  private readonly _fallback?: FallbackRouteConfig;
  private readonly _enter?: RouterConfig['enter'];
  private readonly _leave?: RouterConfig['leave'];
  private readonly _tracker = new RouteTracker();
  private readonly _mode: RouterMode;

  /** 현재 라우팅 요청 ID */
  private _requestID?: string;
  /** 현재 라우팅 정보 */
  private _context?: RouteContext;
  /**
   * fallback 이 제목을 바꾸기 직전의 문서 제목 — 다음 성공 라우트가 제목을 갖지 않으면 이것으로 돌아간다.
   * 제목 없는 라우트는 문서 제목을 그대로 두므로, 없으면 실패 제목(«Page not found»)이 회복 뒤에도 남는다.
   */
  private _titleBeforeFallback?: string;
  /** `RouterConfig.scrollRestoration` 을 켰을 때 — 기록 항목별 스크롤 기억. */
  private _scroll?: ScrollMemory;
  /** 지금 화면의 라우트 사슬(부모 → 자식) — `leave` 가드를 부를 대상. 대체 화면이면 비어 있다. */
  private _activeRoutes: RouteConfig[] = [];
  /**
   * 지금 기록 항목의 순번 — 새 항목마다 하나씩 는다(`history.state.entryIndex`). 뒤로·앞으로 가기가 몇 칸을 건넜는지
   * 알아야 `leave` 가 막은 이동을 원래 항목으로 되돌릴 수 있다(History API 는 그 수를 주지 않는다).
   */
  private _entryIndex = 0;
  /** 가드가 되돌린 이동의 `popstate` 를 기다리는 중이면 — 그 이벤트는 라우팅하지 않고 이것을 부른다. */
  private _reverted?: () => void;
  /** 가드를 통과해 다시 건너는 이동 — 그 `popstate` 는 묻지 않고 라우팅한다. */
  private _approvedTraverse = false;
  /** 마지막 이동의 `leave` 판정 — 이동 요청(`navigate()` · 선택 채널)에 동기로 돌려준다. */
  private _leaveOutcome: LeaveOutcome = 'allowed';

  constructor(config: RouterConfig) {
    this.destroy();

    this._rootElement = config.root;
    this._basepath = absolutePath(config.basepath || '/');
    this._routes = setRoutes(config.routes || [], this._basepath);
    this._fallback = config.fallback;
    this._enter = config.enter;
    this._leave = config.leave;
    this._mode = config.mode === 'hash' ? 'hash' : 'history';
    // `u-link` 는 라우터 인스턴스 없이 히스토리 상태에서 basepath·모드를 읽는다 — 첫 라우팅 전에 그려지는 링크도
    // 모드에 맞는 주소를 내도록 지금 적어 둔다. 항목 순번은 이미 있으면 잇는다(새로 고침 · 다른 문서에서 돌아옴).
    const initial = isRecord(window.history.state) ? window.history.state : {};
    this._entryIndex = typeof initial.entryIndex === 'number' ? initial.entryIndex : 0;
    window.history.replaceState({ ...initial, basepath: this._basepath, mode: this._mode, entryIndex: this._entryIndex }, '');
    // 라우터보다 먼저 붙은 링크(셸을 먼저 그리는 앱)도 이 상태를 따르게 한다.
    window.dispatchEvent(new Event(ROUTER_STATE_EVENT));
    window.addEventListener('popstate', this.handleWindowPopstate);
    window.addEventListener(ROUTER_NAVIGATE_EVENT, this.handleNavigateRequest);
    if (config.scrollRestoration) {
      const container = typeof config.scrollRestoration === 'object' ? config.scrollRestoration.container : undefined;
      this._scroll = new ScrollMemory(() => container?.(), () => this._context?.navigation.entryKey);
    }

    if (config.useIntercept !== false) {
      this._rootElement.addEventListener('click', this.handleRootElementClick);
    }
    if (config.initialLoad !== false) {
      // waitOutlet 은 root 안에서 <u-outlet> 을 못 찾으면 타임아웃 후 reject 한다.
      // .catch() 가 없으면 이 거부가 unhandled rejection 으로만 새어 나가(초기 폴링
      // 시간만큼 지연된 뒤) 소비자는 빈 화면의 원인을 진단하기 어렵다. 명시적으로 표면화한다.
      waitOutlet(this._rootElement)
        .then(() => {
          this.run(currentRouteUrl(this._mode).href, undefined, undefined, initialNavigationType());
        })
        .catch((error) => {
          console.error('Router initialization failed:', error instanceof Error ? error.message : error);
        });
    }
  }

  /** 객체를 정리하고 이벤트 리스너를 제거합니다. */
  public destroy() {
    window.removeEventListener('popstate', this.handleWindowPopstate);
    window.removeEventListener(ROUTER_NAVIGATE_EVENT, this.handleNavigateRequest);
    this._scroll?.destroy();
    this._scroll = undefined;
    this._rootElement?.removeEventListener('click', this.handleRootElementClick);
    this._requestID = undefined;
    this._context = undefined;
  }

  /** 라우터의 기본 경로 반환 */
  public get basepath() {
    return this._basepath;
  }
  /** 라우트를 주소의 어디에서 읽는가(`RouterConfig.mode`). */
  public get mode(): RouterMode {
    return this._mode;
  }
  /** 등록된 라우트 정보 반환 */
  public get routes() {
    return this._routes;
  }
  /** 현재 라우팅 정보 반환 */
  public get context() {
    return this._context;
  }

  /**
   * 지정한 경로의 클라이언트 라우팅을 수행합니다. 상대경로일 경우 basepath와 조합되어 이동합니다.
   * @param href 이동할 경로
   * @param options 네비게이션 옵션
   * @param routes (internal) 호출자가 이미 계산한 라우트 매칭 결과가 있으면 재사용합니다.
   *   `handleRootElementClick`이 가로채기 여부 판단을 위해 미리 계산한 결과를 전달해
   *   동일 pathname에 대한 getRoutes 중복 호출을 피하는 용도입니다. 외부에서 사용하지 마세요.
   */
  public async go(href: string, options?: NavigateOptions, routes?: RouteConfig[]) {
    return this.run(href, options, routes);
  }

  /**
   * 이동 본체. `type` 은 브라우저가 이미 옮긴 항목에 들어갈 때(뒤로·앞으로 가기 · 첫 로드) 호출자가 준다 — 없으면
   * 히스토리를 어떻게 쓰는가로 정한다(`replace` 면 교체, 아니면 새 항목).
   */
  private async run(href: string, options?: NavigateOptions, routes?: RouteConfig[], type?: RouteNavigationType) {
    const current = currentRouteUrl(this._mode);
    const context = parseUrl(toRouteHref(href, this._mode), this._basepath, current);

    // 화면을 떠나는 이동이면 기록을 쓰기 전에 묻는다 — 취소면 화면도 주소도 그대로다. 뒤로·앞으로 가기(`type`)는
    // 브라우저가 이미 항목을 옮겼으므로 `popstate` 처리기가 따로 묻는다.
    // 가드가 바로 답하면 기다리지 않는다 — 기록은 종전처럼 호출한 그 틱에 쓰인다(클릭 직후 주소를 읽는 코드).
    // 이 이동의 요청 ID 는 판정 뒤에 잡는다 — 막힌 이동이 진행 중인 앞 이동을 «더 새 이동» 으로 끊지 않게.
    if (type === undefined && !options?.isRedirect) {
      const leaveType = options?.replace || context.href === current.href ? 'replace' : 'push';
      const decision = this.leaveDecision(context, leaveType);
      this._leaveOutcome = decision === true ? 'allowed' : decision === false ? 'blocked' : 'pending';
      if (decision === false) return;
      if (decision !== true) {
        const before = this._requestID;
        // 가드가 답하는 동안 다른 이동이 시작했으면 그쪽이 이긴다.
        if (!(await decision) || this._requestID !== before) return;
      }
    }

    const requestID = getRandomID();
    this._requestID = requestID;

    if (!options?.isRedirect) this._tracker.reset();

    // 리다이렉트 체인에서만 사이클 감지 (최초 진입은 항상 허용)
    if (options?.isRedirect && this._tracker.visit(context.href)) return;

    // 히스토리 업데이트: isRedirect/replace면 replaceState (뒤로가기에서 경유지 제거)
    const useReplace = options?.isRedirect || options?.replace || context.href === current.href;
    // 같은 기록 항목에 들어가는 이동(뒤로·앞으로 가기 · 첫 로드와 새로 고침 · 같은 주소로의 이동)은 그 항목이 이미
    // 가진 상태 위에 라우터 필드만 갱신한다 — 종전에는 `{ basepath, mode }` 로 덮어써, `go(href, { state })` 로 실은
    // 상태가 Back 으로 돌아오는 순간 지워졌다(`NavigateOptions.state` 의 «다시 읽을 수 있다» 가 첫 방문에만 참이었다).
    // 다른 주소로의 교체(리다이렉트 · `replace`)는 새 위치라 옛 상태를 잇지 않는다.
    const sameEntry = !options?.isRedirect && context.href === current.href;
    const previous = isRecord(window.history.state) ? window.history.state : {};
    const entryState = sameEntry ? previous : {};
    // 이동 종류와 항목 키. 키는 기록 «칸» 의 정체다 — 새 항목이면 새 키, 교체·돌아옴이면 그 칸의 키(없던 칸이면 새로).
    const navigationType: RouteNavigationType = type ?? (useReplace ? 'replace' : 'push');
    const entryKey = navigationType !== 'push' && typeof previous.entryKey === 'string' ? previous.entryKey : getRandomID();
    context.navigation = { type: navigationType, entryKey };
    // 떠나는 화면(지금 그려진 항목)의 스크롤을 기억한다 — 새 항목을 쌓기 직전이면 그 항목 상태에도(새로 고침 뒤 복원).
    // 교체는 같은 칸이라 기억하지 않는다(그 칸을 떠날 때 기억된다).
    if (navigationType === 'push' || navigationType === 'traverse') {
      this._scroll?.remember(this._context?.navigation.entryKey, navigationType === 'push');
    }
    // 항목 순번 — 새 항목은 떠나는 항목 다음, 교체·돌아옴·새로 고침은 그 칸의 것(없던 칸이면 지금 순번).
    const knownIndex = typeof previous.entryIndex === 'number' ? previous.entryIndex : this._entryIndex;
    const entryIndex = navigationType === 'push' ? knownIndex + 1 : knownIndex;
    this._entryIndex = entryIndex;
    // 라우터 필드가 마지막 — 앱 상태가 같은 이름을 써도 모드·항목 키를 덮지 못한다.
    const historyState = { ...entryState, ...options?.state, basepath: context.basepath, mode: this._mode, entryKey, entryIndex };
    const browserHref = toBrowserHref(context.path, context.href, this._mode);
    if (useReplace || navigationType === 'traverse' || navigationType === 'reload') {
      window.history.replaceState(historyState, '', browserHref);
    } else {
      window.history.pushState(historyState, '', browserHref);
    }

    let outlet: UOutlet | undefined = undefined;
    let title: string | undefined = undefined;
    let completed = false;
    try {
      outlet = findOutletOrThrow(this._rootElement);
      
      // 라우트 매칭 및 context 완성 (params, metadata)
      // → enter/이벤트 실행 전에 context를 완전히 채웁니다.
      routes ??= getRoutes(this._routes, context.pathname);
      if (routes.length === 0) throw new NotFoundError(context.href);

      const lastRoute = routes[routes.length - 1];
      if (lastRoute.path instanceof URLPattern) {
        context.params = lastRoute.path.exec({ pathname: context.pathname })?.pathname.groups || {};
      }

      context.progress = (value) => {
        if (this._requestID !== requestID) return;
        const progress = Math.max(0, Math.min(100, Math.round(value)));
        window.dispatchEvent(new RouteProgressEvent(context, progress));
      };

      // 글로벌 enter: redirect 체인 중에는 skip (최초 진입 시 1회만 실행)
      if (this._enter && !options?.isRedirect) {
        const result = await this._enter(context);
        if (this._requestID !== requestID) return;
        if (result === false) throw new AccessDeniedError(context.pathname);
        if (typeof result === 'string') return void this.go(result, { isRedirect: true });
      }

      // context 확정 및 라우트 시작 이벤트 발생
      this._context = context;
      this._activeRoutes = routes;
      window.dispatchEvent(new RouteBeginEvent(context));
      for (const route of routes) {
        if (this._requestID !== requestID) return;
        // 라우트 메타데이터 병합 (부모 → 자식)
        context.metadata = { ...context.metadata, ...route.metadata };

        // 라우트별 enter: 이미 실행된 route는 skip (redirect 체인에서 부모 enter 중복 방지)
        if (route.enter && this._tracker.enter(route)) {
          const result = await route.enter(context);
          if (this._requestID !== requestID) return;
          if (result === false) throw new AccessDeniedError(context.pathname);
          if (typeof result === 'string') return void this.go(result, { isRedirect: true });
        }

        if (!route.render) continue;

        let content: unknown;
        try {
          content = await route.render(context);
          if (content === false || content === undefined || content === null) {
            throw new Error(
              `Route render() returned ${content === false ? 'false' : String(content)} for ` +
                `"${context.pathname}"${route.id ? ` (route id: "${route.id}")` : ''} — ` +
                `a route's render() must return an HTMLElement, a Lit TemplateResult, or a React element.`,
            );
          }
        } catch (e) {
          // 라우트가 스스로 고른 실패(`throw new NotFoundError(path)` — 레코드가 없다)는 그대로 둔다.
          // 감싸면 코드가 CONTENT_LOAD_FAILED 로 바뀌어 fallback 이 404 를 알 수 없다.
          if (e instanceof RouteError) throw e;
          throw new ContentLoadError(e);
        }

        try {
          await outlet.render(content, { id: route.id, key: route.key?.(context) });
        } catch (e) {
          throw new ContentRenderError(e);
        }

        if ('children' in route && route.children && route.children.length > 0) {
          // 자식 라우트가 있는 경우, 렌더링된 컨텐츠 내의 outlet이 준비될 때까지 대기
          outlet = await waitOutlet(outlet, 2_000, true);
        } else {
          // 자식 라우트가 없는 경우, 다음 라우트에서 같은 outlet이 재사용될 수 있도록 skip 옵션으로 다시 찾기
          outlet = findOutlet(outlet, true) || outlet;
        }
        title = route.title || title;
      }
      completed = true;
      // 라우트 완료 이벤트 발생
      window.dispatchEvent(new RouteDoneEvent(context));
    } catch (error: any) {
      const routeError = error instanceof RouteError ? error
        : new RouteError(
          error?.status || error?.code || 'UNKNOWN_ERROR', 
          error?.message || 'An unexpected error occurred', 
          error);

      // 대체 화면은 라우트 사슬이 아니다 — 그 화면을 떠날 때는 글로벌 `leave` 만 묻는다.
      if (this._requestID === requestID) this._activeRoutes = [];
      window.dispatchEvent(new RouteErrorEvent(context, routeError));
      // 예상된 결과(4xx — 없는 경로 · 가드 거부 · 라우트가 고른 «레코드 없음»)는 fallback 이 정상 화면으로 그린다.
      // 오류로 로깅하면 콘솔 오류를 수집하는 모니터링이 권한 없는 이동마다 «장애» 를 받는다. 전부를 보려면
      // `route-error` 를 듣는다 — 그 이벤트는 모든 실패에 난다. 예상 밖 실패(로드 · 렌더 · outlet)는 메시지가
      // «콘솔을 보라» 고 말하므로 원인을 계속 남긴다.
      if (!isExpectedOutcome(routeError)) {
        console.error('Routing error:', routeError.original || routeError);
      }

      try {
        const fallbackContext = { ...context, error: routeError };
        const content = this._fallback?.render
          ? await this._fallback.render(fallbackContext)
          : new UErrorPage(routeError);
        if (outlet) {
          outlet.render(content, { id: getRandomID() });
        } else {
          document.body.innerHTML = '';
          document.body.appendChild(content instanceof Node ? content : new UErrorPage(routeError));
        }
        const fallbackTitle = this._fallback?.title;
        title = (typeof fallbackTitle === 'function' ? fallbackTitle(fallbackContext) : fallbackTitle)
          || routeError.message || 'Error';
        // 실패가 이어지면 첫 실패 직전의 제목을 지킨다.
        this._titleBeforeFallback ??= document.title;
      } catch (pageError) {
        console.error('Failed to render error component:', pageError);
        console.error('Original error:', routeError.original || routeError);
      }
    } finally {
      // 화면(또는 대체 화면)이 선 뒤 — 이 이동이 아직 최신일 때만 위치를 정한다(리다이렉트·더 새 이동이 넘겨받았으면 그쪽이).
      if (this._requestID === requestID) this._scroll?.arrive(context.navigation, context.hash);
      if (completed && this._titleBeforeFallback !== undefined) {
        title ||= this._titleBeforeFallback;
        this._titleBeforeFallback = undefined;
      }
      document.title = title || document.title;
    }
  }

  /**
   * 화면을 떠나도 되는가 — 지금 화면의 라우트 `leave`(자식 → 부모) 다음 글로벌 `leave`. 하나라도 `false` 거나 던지면
   * 떠나지 않는다. 화면을 바꾸지 않는 이동(해시만 다름)과 첫 라우팅에는 묻지 않는다.
   * 모든 가드가 바로 답하면 `boolean`, 하나라도 Promise 를 돌려주면 `Promise<boolean>`.
   */
  private leaveDecision(to: RouteContext, type: RouteNavigationType): boolean | Promise<boolean> {
    const from = this._context;
    const guards = this.leaveGuardsFor(to);
    if (!from || guards.length === 0) return true;
    to.navigation = { type, entryKey: '' };
    const fail = (error: unknown) => {
      console.error('Route leave guard failed — staying on the current screen:', error);
      return false;
    };
    // 동기 우선 — 가드가 바로 답하는 동안은 바로 답한다(이동이 호출한 그 틱에 진행한다). Promise 를 돌려준 가드부터는
    // 나머지를 이어 묻는 Promise 가 된다.
    const ask = (start: number): boolean | Promise<boolean> => {
      for (let i = start; i < guards.length; i++) {
        let answer: boolean | Promise<boolean>;
        try {
          answer = guards[i]({ from, to });
        } catch (error) {
          return fail(error);
        }
        if (answer === false) return false;
        if (typeof (answer as Promise<boolean> | undefined)?.then === 'function') {
          return Promise.resolve(answer).then((value) => (value === false ? false : ask(i + 1)), fail);
        }
      }
      return true;
    };
    return ask(0);
  }

  /** 이 이동이 물어야 할 가드 — 지금 화면의 라우트(자식 → 부모) 다음 글로벌. 화면을 떠나지 않거나 첫 라우팅이면 없다. */
  private leaveGuardsFor(to: RouteContext): Array<(ctx: RouteLeaveContext) => Promise<boolean> | boolean> {
    const from = this._context;
    if (!from || !leavesScreen(from, to)) return [];
    const guards: Array<(ctx: RouteLeaveContext) => Promise<boolean> | boolean> = [];
    for (const route of [...this._activeRoutes].reverse()) if (route.leave) guards.push(route.leave);
    if (this._leave) guards.push(this._leave);
    return guards;
  }

  /** 브라우저 히스토리 이벤트가 발생시 라우팅 처리 */
  private handleWindowPopstate = async (_: PopStateEvent) => {
    // 가드가 되돌린 이동 — 원래 항목으로 돌아왔을 뿐이라 라우팅하지 않는다.
    if (this._reverted) {
      const done = this._reverted;
      this._reverted = undefined;
      done();
      return;
    }
    const href = currentRouteUrl(this._mode).href;
    if (this._approvedTraverse) this._approvedTraverse = false;
    else if (!(await this.confirmTraverse(href))) return;
    await this.run(href, undefined, undefined, 'traverse');
  };

  /**
   * 뒤로·앞으로 가기를 `leave` 에 묻는다 — 브라우저가 이미 항목을 옮겼으므로 먼저 원래 항목으로 되돌리고 묻는다
   * (묻는 동안 주소가 떠나는 곳을 가리키지 않게). 통과하면 같은 칸 수만큼 다시 건너고(`false` 를 돌려 이번 이벤트는
   * 라우팅하지 않는다 — 다시 건넌 이동이 라우팅한다), 막히면 원래 항목에 머문다.
   * 건넌 칸 수를 모르면(라우터가 쓰지 않은 항목) 되돌리지 않고 묻고, 막히면 떠나던 화면의 주소를 새 항목으로 다시 쌓는다.
   */
  private async confirmTraverse(href: string): Promise<boolean> {
    const from = this._context;
    if (!from) return true;
    const to = parseUrl(toRouteHref(href, this._mode), this._basepath, currentRouteUrl(this._mode));
    // 가드가 바로 통과시키면 되돌리지 않는다 — 대부분의 뒤로 가기(저장 안 한 변경이 없는 화면)는 종전 그대로다.
    const decision = this.leaveDecision(to, 'traverse');
    if (decision === true) return true;
    const state = isRecord(window.history.state) ? window.history.state : {};
    const delta = typeof state.entryIndex === 'number' ? state.entryIndex - this._entryIndex : 0;
    if (delta !== 0) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => { this._reverted = undefined; resolve(); }, REVERT_TIMEOUT);
        this._reverted = () => { clearTimeout(timer); resolve(); };
        window.history.go(-delta);
      });
    }
    const allowed = typeof decision === 'boolean' ? decision : await decision;
    if (allowed) {
      if (delta === 0) return true;
      this._approvedTraverse = true;
      window.history.go(delta);
      return false;
    }
    if (delta === 0) {
      const back = { basepath: from.basepath, mode: this._mode, entryKey: from.navigation.entryKey, entryIndex: this._entryIndex };
      window.history.pushState(back, '', toBrowserHref(from.path, from.href, this._mode));
    }
    return false;
  }

  /** 라우터 인스턴스 없이 낸 이동 요청(`navigate()` · `u-link`)을 받는다 — 먼저 받은 라우터 하나가 처리한다. */
  private handleNavigateRequest = (e: CustomEvent<RouterNavigateRequest>) => {
    if (e.defaultPrevented) return;
    e.preventDefault();
    // `go()` 의 동기 구간이 `leave` 판정까지 간다 — 그 결과를 요청자(선택 채널)에게 돌려준다.
    this._leaveOutcome = 'allowed';
    void this.go(e.detail.href, e.detail.options);
    e.detail.leave = this._leaveOutcome;
  };

  /** 클릭 이벤트에서 라우터로 처리할 앵커를 찾아 클라이언트 라우팅 수행 */
  private handleRootElementClick = async (e: MouseEvent) => {
    try {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;

      const anchor = findAnchorFrom(e);
      if (!anchor) return;

      const href = anchor.getAttribute('href') || anchor.href;
      if (!href) return;
      if (isExternalUrl(href)) return;
      if (anchor.hasAttribute('download')) return;
      if (anchor.getAttribute('rel') === 'external') return;
      // 「이 링크는 다른 문서다」 — 같은 오리진의 비-SPA 경로. `u-link[navigate="document"]` 가
      // 렌더하는 앵커에 붙고, 평범한 `<a>` 에 직접 써도 동작한다.
      // ⚠ULink 의 핸들러만 고치면 부족하다: 그쪽이 preventDefault 를 하지 않아도 이 전역
      //   위임이 뒤이어 받으므로, 등록된 라우트를 가리키는 경우 여기서 다시 가로채진다.
      if (anchor.getAttribute('data-navigate') === 'document') return;
      if (anchor.target && anchor.target !== '') return;

      // hash 모드: `#/x` 를 단 이 문서의 앵커는 `#` 뒤가 라우트다 — 그 밖의 앵커는 종전처럼 경로로 본다.
      const routeHref = toRouteHref(anchor.href, this._mode);
      const pathname = new URL(routeHref, window.location.origin).pathname;
      if (this._basepath !== '/' && !pathname.startsWith(this._basepath)) return;
      // 등록된 라우트에 매칭되지 않는 경로는 가로채지 않고 네이티브 내비게이션에 맡깁니다.
      // (특히 basepath '/'에서 다른 앱의 경로를 soft-404로 렌더하는 것을 방지)
      const routes = getRoutes(this._routes, pathname);
      if (routes.length === 0) return;

      e.preventDefault();
      // 위에서 계산한 매칭 결과를 그대로 전달해 go() 내부의 getRoutes 재계산을 생략합니다.
      await this.go(routeHref, undefined, routes);
    } catch {
      // 예외는 무시하고 기본 동작 유지
    }
  };
}
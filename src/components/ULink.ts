import { absolutePath, basepathRoot, isExternalUrl } from "../internals/url-helpers.js";
import { currentRouteUrl, stateMode, toBrowserHref, ROUTER_STATE_EVENT } from "../internals/location.js";

const STYLES = `
  :host {
    cursor: pointer;
  }

  a {
    text-decoration: none;

    font-size: inherit;
    font-weight: inherit;
    font-family: inherit;
    color: inherit;
    cursor: inherit;
  }
`;

/** 속성 이름 ↔ 프로퍼티 — 속성을 바꾸면 프로퍼티가 따라온다(프로퍼티는 속성으로 반영하지 않는다). */
const PROPS = ['href', 'target', 'rel', 'navigate'] as const;

/**
 * - 클라이언트 라우팅을 지원하는 링크 엘리먼트입니다.
 * - 내부 링크는 클라이언트 라우팅을 수행하고, 외부 링크는 브라우저 기본 네비게이션을 사용합니다.
 * - Ctrl/Meta/Shift/Alt, 중클릭/우클릭 등은 브라우저 기본 동작(새 탭, 컨텍스트 메뉴 등)을 그대로 유지합니다.
 *
 * Lit 없이 쓰는 표준 커스텀 엘리먼트다 — 라우터가 Lit 을 필수 의존으로 끌고 오지 않도록(React·요소만 쓰는 앱).
 * 값이 바뀌면 그 자리에서 내부 `<a>` 를 다시 맞춘다(비동기 갱신 주기가 없다).
 */
export class ULink extends HTMLElement {
  static readonly observedAttributes = [...PROPS, 'aria-current', 'aria-label'];

  /** 외부 링크 여부 */
  private isExternal: boolean = false;
  private _href?: string;
  private _target?: string;
  private _rel?: string;
  private _navigate?: "router" | "document";
  private readonly anchor: HTMLAnchorElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = STYLES;
    this.anchor = document.createElement("a");
    this.anchor.appendChild(document.createElement("slot"));
    root.append(style, this.anchor);
    // 정의되기 전에 세팅된 프로퍼티(업그레이드 전 인스턴스 값)는 접근자를 가린다 — 걷어 내고 접근자로 다시 넣는다.
    for (const p of PROPS) {
      if (Object.prototype.hasOwnProperty.call(this, p)) {
        const value = (this as Record<string, unknown>)[p];
        delete (this as Record<string, unknown>)[p];
        (this as Record<string, unknown>)[p] = value;
      }
    }
    this.sync();
  }

  /**
   * 링크 대상 target 속성
   * 
   * - `_self`: 현재 창에서 링크 열기 (기본값)
   * - `_blank`: 새 탭/창에서 링크 열기
   * - `_parent`: 부모 프레임에서 링크 열기
   * - `_top`: 최상위 프레임에서 링크 열기
   */
  get target(): string | undefined { return this._target; }
  set target(value: string | undefined) { this._target = value ?? undefined; this.sync(); }

  /** 
   * 링크 관계 rel 속성
   * 
   * - `noopener`: target이 _blank인 경우 보안 강화 (window.opener 차단)
   * - `noreferrer`: target이 _blank인 경우 보안 강화 + Referer 헤더 제거
   * - `external`: 외부 링크임을 명시 (SEO/접근성에 도움)
   * - `nofollow`: 검색 엔진이 링크를 따라가지 않도록 지시 (SEO에 영향)
   * - 그 외 rel 값도 그대로 전달됩니다. 
   */
  get rel(): string | undefined { return this._rel; }
  set rel(value: string | undefined) { this._rel = value ?? undefined; this.sync(); }

  /**
   * 링크 대상 URL, 다음 사항에 따라 SPA 라우팅 또는 브라우저 네비게이션이 결정됩니다.
   * 
   * - 속성을 정의하지 않으면 설정에서 지정한 `basepath`로 SPA 라우팅합니다.
   * - http(s)로 시작하면 외부 링크로 간주하고 브라우저 네비게이션을 사용합니다.
   * - 절대경로(/...)의 경우 `basepath`로 시작하면 SPA 라우팅합니다, 이외 브라우저 네비게이션을 사용합니다.
   * - 상대경로는 (basepath + 상대경로)로 결합하여 SPA 라우팅합니다.
   * - ?로 시작하면 현재 경로에 쿼리스트링을 추가하여 SPA 라우팅합니다.
   * - #으로 시작하면 브라우저 기본 동작을 사용합니다.
   */
  get href(): string | undefined { return this._href; }
  set href(value: string | undefined) {
    this._href = value ?? undefined;
    this.isExternal = isExternalUrl(this._href || "");
    this.sync();
  }

  /**
   * 이 링크를 라우터가 처리할지, 브라우저의 문서 이동에 맡길지.
   *
   * - `router`(기본): 종전 동작 그대로 — 같은 오리진이면 SPA 이동, 아니면 브라우저에 맡긴다.
   * - `document`: 라우터가 **가로채지 않는다.** 같은 오리진이지만 SPA 라우트가 아닌 경로
   *   (정적 문서 사이트, 서버 렌더 페이지, 파일 다운로드 엔드포인트, 인증 리다이렉트)를 가리킬 때 쓴다.
   *
   * ⚠**「외부 오리진」이 아니라 「다른 문서」다.** 종전에는 이 구분이 **오리진 비교 하나**로만
   * 결정돼서, 같은 오리진의 비-SPA 경로를 가리킬 수단이 없었다 — 라우터가 클릭을 가로채고
   * 등록되지 않은 라우트이므로 화면이 not-found 로 떨어졌다. 빠져나갈 길이 셋뿐이었고
   * (다른 오리진 · `target="_blank"` · `#` 프래그먼트) 셋 다 요구와 다르다:
   * 같은 오리진이어야 하고(쿠키·세션·역방향 프록시), **같은 탭**이어야 하며, 다른 문서다.
   *
   * ```html
   * <u-link href="/help/" navigate="document">Help</u-link>
   * ```
   *
   * ⚠**자동 판정을 넓히지 않는다.** 「등록된 라우트와 대조해 미등록이면 문서 이동」도 가능하지만
   * 라우트가 늦게 등록되면 판정이 **시점에 의존**하게 된다. 명시 선언이 예측 가능하다.
   */
  get navigate(): "router" | "document" | undefined { return this._navigate; }
  set navigate(value: "router" | "document" | undefined) { this._navigate = value ?? undefined; this.sync(); }

  connectedCallback() {
    this.addEventListener("click", this.handleClick);
    // basepath·모드는 히스토리 상태에서 읽는다 — 붙는 시점의 값으로 다시 맞추고, 라우터가 나중에 그 상태를
    // 적으면(라우터보다 먼저 그려진 셸) 그때 다시 맞춘다.
    window.addEventListener(ROUTER_STATE_EVENT, this.handleRouterState);
    this.sync();
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.handleClick);
    window.removeEventListener(ROUTER_STATE_EVENT, this.handleRouterState);
  }

  private handleRouterState = () => this.sync();

  /**
   * 호스트에 세팅된 `aria-current`/`aria-label`은 실제 접근 가능한(포커스 대상)
   * 엘리먼트가 아니라 — 그 안쪽 shadow DOM 의 네이티브 `<a>`다. 섀도우 경계를
   * 넘지 않으므로 접근성 트리에 자동 반영되지 않는다(실측 — 속성은
   * 붙어 있는데 접근성 트리의 `aria-current`는 계속 비어 있음). 그래서 `sync()`가 이
   * 값을 읽어 내부 `<a>`에 직접 옮기고, 두 속성을 `observedAttributes`에 둬 연결 후의
   * 변경도 반영한다(목록에 없는 속성은 `attributeChangedCallback` 자체가 호출되지 않는다).
   */
  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if ((PROPS as readonly string[]).includes(name)) {
      (this as Record<string, unknown>)[name] = value ?? undefined;
    } else {
      this.sync();
    }
  }

  /** 내부 `<a>` 를 지금 값으로 맞춘다. */
  private sync() {
    const a = this.anchor;
    if (!a) return; // 생성자 안, 앵커를 만들기 전의 세터 호출
    a.setAttribute("href", this.compute(this._href));
    const attrs: Record<string, string | null | undefined> = {
      target: this._target,
      rel: this._rel,
      "data-navigate": this._navigate,
      "aria-current": this.getAttribute("aria-current"),
      "aria-label": this.getAttribute("aria-label"),
    };
    for (const [name, value] of Object.entries(attrs)) {
      if (value == null) a.removeAttribute(name);
      else a.setAttribute(name, value);
    }
  }

  private compute(href?: string): string {
    const basepath = this.getBasepath();
    // hash 모드면 라우트 경로를 `#` 뒤에 싣는다 — 새 탭·주소 복사가 같은 화면으로 열린다.
    if (stateMode() === "hash") {
      if (!href) return "#" + basepathRoot(basepath);
      if (this.isExternal || href.startsWith("#")) return href;
      if (href.startsWith("?")) return "#" + currentRouteUrl("hash").pathname + href;
      return "#" + (href.startsWith("/") ? href : absolutePath(basepath, href));
    }

    // href 속성이 없으면 basepath 루트로 이동 — 끝 `/` 를 붙인 디렉터리 URL(`basepathRoot`)
    if (!href) return window.location.origin + basepathRoot(basepath);
    // 외부 링크는 그대로 (http/https 등)
    if (this.isExternal) return href;
    // 절대경로(/...)는 그대로 표시
    if (href.startsWith("/")) return href;
    // 해시 / 쿼리스트링은 그대로 (브라우저가 표시/처리)
    if (href.startsWith("#") || href.startsWith("?")) return href;
    
    // 상대경로는 basepath와 결합해서 표시
    return absolutePath(basepath, href);
  }

  /**
   * 클릭 가로채기 핸들러
   * - 좌클릭(0) + 보조키 없음(ctrl/meta/shift/alt 없음) + target이 _self일 때만 SPA 라우팅 고려
   * - 그 외(중클릭/우클릭/보조키/target=_blank 등)는 브라우저 기본 동작 유지
   */
  private handleClick = (event: MouseEvent) => {
    // 이미 막힌 이벤트면 건드리지 않음
    if (event.defaultPrevented) return;

    // 우클/중클/보조키는 그대로
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    // target이 _blank 등으로 지정되면 브라우저 동작 유지
    if (this.target && this.target.toLowerCase() !== "_self") return;

    // 문서 이동으로 선언됐으면 라우터는 손대지 않는다 (같은 오리진의 비-SPA 경로)
    if (this.navigate === "document") return;

    const basepath = this.getBasepath();

    // href 없으면 basepath로 SPA 라우팅
    if (!this.href) {
      event.preventDefault();
      this.dispatchPopstate(basepath, basepathRoot(basepath));
      return;
    }

    // 외부 링크 또는 hash(#)는 브라우저 기본 동작 유지
    if (this.isExternal) return;
    if (this.href.startsWith("#")) return;

    // 여기부터는 SPA 라우팅으로 가로채는 케이스들
    event.preventDefault();

    if (this.href.startsWith("?")) {
      // 현재 pathname + ?query (hash 모드면 `#` 뒤의 라우트 경로)
      const url = currentRouteUrl(stateMode()).pathname + this.href;
      this.dispatchPopstate(basepath, url);
      return;
    }

    if (this.href.startsWith("/")) {
      // 절대경로인데 basepath 밖이면 전체 페이지 네비게이션이 자연스럽지만,
      // a 태그 기본을 막았기 때문에 직접 이동시켜야 함
      if (!this.href.startsWith(basepath)) {
        window.location.assign(this.href);
        return;
      }
      // basepath 내부면 SPA 라우팅
      this.dispatchPopstate(basepath, this.href);
      return;
    }

    // 상대경로 → basepath와 결합 후 SPA 라우팅
    const url = absolutePath(basepath, this.href);
    this.dispatchPopstate(basepath, url);
  };

  /** 클라이언트 라우팅을 위해 popstate 이벤트를 발생시킵니다. */
  private dispatchPopstate(basepath: string, url: string) {
    const mode = stateMode();
    window.history.pushState({ basepath, mode }, "", toBrowserHref(url, url, mode));
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  /** basepath를 state에서 꺼내는 헬퍼 */
  private getBasepath(): string {
    return window.history.state?.basepath || "/";
  };
}

customElements.define("u-link", ULink);

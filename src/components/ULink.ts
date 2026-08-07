import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";

import { absolutePath, isExternalUrl } from "../internals/url-helpers.js";

/**
 * - 클라이언트 라우팅을 지원하는 링크 엘리먼트입니다.
 * - 내부 링크는 클라이언트 라우팅을 수행하고, 외부 링크는 브라우저 기본 네비게이션을 사용합니다.
 * - Ctrl/Meta/Shift/Alt, 중클릭/우클릭 등은 브라우저 기본 동작(새 탭, 컨텍스트 메뉴 등)을 그대로 유지합니다.
 */
@customElement("u-link")
export class ULink extends LitElement {
  /** 외부 링크 여부 */
  private isExternal: boolean = false;

  /**
   * 링크 대상 target 속성
   * 
   * - `_self`: 현재 창에서 링크 열기 (기본값)
   * - `_blank`: 새 탭/창에서 링크 열기
   * - `_parent`: 부모 프레임에서 링크 열기
   * - `_top`: 최상위 프레임에서 링크 열기
   */
  @property({ type: String }) target?: string;

  /** 
   * 링크 관계 rel 속성
   * 
   * - `noopener`: target이 _blank인 경우 보안 강화 (window.opener 차단)
   * - `noreferrer`: target이 _blank인 경우 보안 강화 + Referer 헤더 제거
   * - `external`: 외부 링크임을 명시 (SEO/접근성에 도움)
   * - `nofollow`: 검색 엔진이 링크를 따라가지 않도록 지시 (SEO에 영향)
   * - 그 외 rel 값도 그대로 전달됩니다. 
   */
  @property({ type: String }) rel?: string;

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
  @property({ type: String }) href?: string;

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
  @property({ type: String }) navigate?: "router" | "document";

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.handleClick);
    super.disconnectedCallback();
  }

  protected willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has("href")) {
      this.isExternal = isExternalUrl(this.href || "");
    }
  }

  render() {
    return html`
      <a
        href=${this.compute(this.href)}
        target=${ifDefined(this.target)}
        rel=${ifDefined(this.rel)}
        data-navigate=${ifDefined(this.navigate)}
      >
        <slot></slot>
      </a>
    `;
  }

  /** a 태그에 주입할 href 값을 계산합니다. */
  private compute(href?: string): string {
    const basepath = this.getBasepath();

    // href 속성이 없으면 basepath로 이동
    if (!href) return window.location.origin + basepath;
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
      this.dispatchPopstate(basepath, basepath);
      return;
    }

    // 외부 링크 또는 hash(#)는 브라우저 기본 동작 유지
    if (this.isExternal) return;
    if (this.href.startsWith("#")) return;

    // 여기부터는 SPA 라우팅으로 가로채는 케이스들
    event.preventDefault();

    if (this.href.startsWith("?")) {
      // 현재 pathname + ?query
      const url = window.location.pathname + this.href;
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
    window.history.pushState({ basepath }, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  /** basepath를 state에서 꺼내는 헬퍼 */
  private getBasepath(): string {
    return window.history.state?.basepath || "/";
  };

  static styles = css`
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
}

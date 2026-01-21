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
      <a target=${ifDefined(this.target)} href=${this.compute(this.href)}>
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
    return window.history.state?.basepath || "";
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

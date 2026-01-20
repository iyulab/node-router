import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

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
   * a 태그 target을 지원하고 싶으면 열어두는게 좋습니다.
   * - _blank 등을 쓰면 무조건 브라우저 기본 동작을 따르도록 처리합니다.
   */
  @property({ type: String }) target?: string;

  /**
   * - 속성을 정의하지 않으면 basepath로 이동합니다.
   * - http(s)로 시작하면 외부 링크로 간주하고 브라우저 네비게이션을 사용합니다.
   * - 절대경로(/...)일 경우 basepath로 시작하면 SPA 라우팅 대상이 될 수 있습니다.
   * - 상대경로는 (basepath + 상대경로)로 SPA 라우팅 대상이 될 수 있습니다.
   * - ?로 시작하면 현재 pathname에 쿼리스트링을 붙여 SPA 라우팅합니다.
   * - #으로 시작하면 현재 URL에 해시만 바꾸고(브라우저 기본) 동작합니다.
   */
  @property({ type: String }) href?: string;

  protected willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has("href")) {
      this.isExternal = isExternalUrl(this.href || "");
    }
  }

  render() {
    return html`
      <a 
        target=${this.target ?? "_self"}
        href=${this.computeHref(this.href)}
        @click=${this.handleAnchorClick}>
        <slot></slot>
      </a>
    `;
  }

  /** basepath를 state에서 꺼내는 헬퍼 */
  private getBasepath(): string {
    return window.history.state?.basepath || "";
  }

  /** a 태그에 주입할 href 값을 계산합니다. */
  private computeHref(href?: string): string {
    const basepath = this.getBasepath();

    // href 속성이 없으면 basepath로 이동 (절대 URL로 넣어 hover 표시 확실히)
    if (!href) {
      return window.location.origin + basepath;
    }

    // 외부 링크는 그대로 (http/https 등)
    if (this.isExternal) return href;

    // 해시 / 쿼리스트링은 그대로 (브라우저가 표시/처리)
    if (href.startsWith("#") || href.startsWith("?")) return href;

    // 절대경로(/...)는 그대로 표시
    if (href.startsWith("/")) return href;

    // 상대경로는 basepath와 결합해서 표시
    return absolutePath(basepath, href);
  }

  /**
   * 클릭 가로채기 규칙
   * - 좌클릭(0) + 보조키 없음(ctrl/meta/shift/alt 없음) + target이 _self일 때만 SPA 라우팅 고려
   * - 그 외(중클릭/우클릭/보조키/target=_blank 등)는 브라우저 기본 동작 유지
   */
  private handleAnchorClick = (event: MouseEvent) => {
    // 이미 막힌 이벤트면 건드리지 않음
    if (event.defaultPrevented) return;

    // 좌클릭만 SPA 라우팅 고려
    if (event.button !== 0) return;

    // 보조키가 있으면(새 탭/새 창 등) 브라우저에 맡김
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    // target이 _blank 등으로 지정되면 브라우저 동작 유지
    const target = (this.target ?? "").trim();
    if (target && target.toLowerCase() !== "_self") return;

    const basepath = this.getBasepath();

    // href 없으면 basepath로 SPA 라우팅
    if (!this.href) {
      event.preventDefault();
      this.dispatchPopstate(basepath, basepath);
      return;
    }

    // 외부 링크는 브라우저 네비게이션
    if (this.isExternal) return;

    // hash(#)는 브라우저 기본 동작 유지 (hashchange를 브라우저가 발생시킴)
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
  }

  static styles = css`
    :host {
      display: inline-flex;
      cursor: pointer;
    }

    a {
      display: contents;
      text-decoration: none;

      font-size: inherit;
      font-weight: inherit;
      font-family: inherit;
      color: inherit;
      cursor: inherit;
    }
  `;
}

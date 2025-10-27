import { LitElement, css, html } from "lit";
import { property, state } from "lit/decorators.js";

import { absolutePath } from "../internals";

/** 외부 링크 패턴 목록 */
const EXTERNAL_LINK_PATTERNS = [
  /^http/, /^\/\//, /^mailto:/, /^tel:/, /^javascript:/, /^ftp:/, /^data:/, /^ws:/, /^wss:/
];

/**
 * - 클라이언트 라우팅을 지원하는 링크 엘리먼트입니다.
 * - 내부 링크는 클라이언트 라우팅을 수행하고, 외부 링크는 새로운 페이지로 이동합니다.
 * - 마우스 중간 버튼 클릭 또는 Ctrl 키를 누르면 새로운 탭에서 엽니다.
 */
export class Link extends LitElement {
  /** 외부 링크 여부 */
  private isExternal: boolean = false;
  
  /** a 태그의 href 속성 및 새로운 페이지로 이동할 때 사용될 링크입니다. */
  @state() anchorHref: string = '#';

  /**
   * - 속성을 정의하지 않으면 basepath로 이동합니다.
   * - http 로 시작하면 새로운 페이지를 로드합니다.
   * - 절대경로일 경우 basepath로 시작하면 클라이언트 라우팅을 합니다. 그렇지 않으면 새로운 페이지를 로드합니다.
   * - 상대경로로 시작하면 (현재의 basepath + 상대경로)로 클라이언트 라우팅을 합니다.
   * - ?로 시작하면 현재 경로에 쿼리스트링을 추가하고, 클라이언트 라우팅을 합니다.
   * - #으로 시작하면 현재 경로에 해시를 추가하고, hashchange 이벤트를 발생시킵니다.
   */
  @property({ type: String }) href?: string;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('mousedown', this.handleMouseDown);
  }

  disconnectedCallback() {
    this.removeEventListener('mousedown', this.handleMouseDown);
    super.disconnectedCallback();
  }

  protected async updated(changedProperties: any) {
    super.updated(changedProperties);
    await this.updateComplete;

    if (changedProperties.has('href')) {
      this.isExternal = this.checkExternalLink(this.href || '');
      this.anchorHref = this.getAnchorHref(this.href);
    }
  }

  render() {
    return html`
      <a href=${this.anchorHref} @click=${this.preventClickEvent}>
        <slot></slot>
      </a>
    `;
  }

  /**
   * 링크 엘리먼트의 마우스 이벤트 핸들러
   * - 새로운 탭에서 열기: 마우스 중간 버튼 또는 Ctrl 키를 누릅니다.
   * - 새로운 페이지로 이동: http로 시작하거나 절대경로일 경우 새로운 페이지로 이동합니다.
   * - 클라이언트 라우팅: 상대경로로 시작하면 클라이언트 라우팅을 합니다.
   */
  private handleMouseDown = (event: MouseEvent) => {
    // 네비게이션 이벤트가 아닌 경우는 처리하지 않습니다.
    const isNonNavigationClick = event.button === 2 || event.metaKey || event.shiftKey || event.altKey;
    if (event.defaultPrevented || isNonNavigationClick) return;

    event.preventDefault();
    event.stopPropagation(); 
    const basepath = window.history.state?.basepath || '';

    if (event.button === 1 || event.ctrlKey) {
      // 마우스 중간 버튼 또는 Ctrl 키를 누르면 새 탭에서 열립니다.
      window.open(this.anchorHref, '_blank');
    } else if (!this.href) {
      // href 속성이 없으면 basepath로 이동합니다.
      this.dispatchPopstate(basepath, basepath);
    } else if (this.isExternal || (this.href.startsWith("/") && !this.href.startsWith(basepath))) {
      // 외부링크 이거나 basepath가 아닌 절대경로일 경우 새로운 페이지로 이동합니다.
      window.location.href = this.href;
    } else if (this.href.startsWith('#')) {
      // 해시로 시작하면 hashchange 이벤트를 발생시킵니다.
      const url = window.location.pathname + window.location.search + this.href;
      this.dispatchHashchange(basepath, url);
    } else if (this.href.startsWith('?')) {
      const url = window.location.pathname + this.href;
      this.dispatchPopstate(basepath, url);
    } else {
      const url =absolutePath(basepath, this.href);
      this.dispatchPopstate(basepath, url);
    }
  }

  /** 클라이언트 라우팅을 위해 popstate 이벤트를 발생시킵니다. */
  private dispatchPopstate(basepath: string, url: string) {
    window.history.pushState({ basepath: basepath }, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  /** 클라이언트 라우팅을 위해 hashchange 이벤트를 발생시킵니다. */
  private dispatchHashchange(basepath: string, url: string) {
    window.history.pushState({ basepath: basepath }, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  /** 기본 a 태그의 클릭 이벤트를 막습니다. */
  private preventClickEvent = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }

  /** 외부 링크인지 확인합니다. */
  private checkExternalLink(href: string) {
    return EXTERNAL_LINK_PATTERNS.some((pattern) => pattern.test(href));
  }

  /** a 태그의 href 값을 계산합니다. */
  private getAnchorHref(href?: string): string {
    const basepath = window.history.state?.basepath || '';
    
    // href 속성이 없으면 basepath로 이동합니다.
    if (!href) {
      return window.location.origin + basepath;
    }
    
    // 외부 링크이거나 절대경로일 경우 그대로 반환합니다.
    if (this.isExternal || href.startsWith('/') || href.startsWith('#') || href.startsWith('?')) {
      return href;
    }

    // 상대경로일 경우 basepath와 결합하여 반환합니다.
    return absolutePath(basepath, href);
  }

  static styles = css`
    :host {
      display: inline-flex;
      cursor: pointer;
    }

    a {
      display: contents;
      text-decoration: none;
      color: inherit;
    }
  `;
}
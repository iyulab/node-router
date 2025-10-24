import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { createComponent } from "@lit/react";
import React from 'react';
import { combinePath } from "../Utils";

@customElement('u-link')
export class ULink extends LitElement {
  private static externalLinks = [/^http/, /^\/\//, /^mailto:/, 
    /^tel:/, /^javascript:/, /^ftp:/, /^data:/, /^ws:/, /^wss:/ ];
  private isExternalLink: boolean = false;
  
  /**
   * a 태그의 href 속성 및 새로운 페이지로 이동할 때 사용될 링크입니다.
   */
  @state() link: string = '#';

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
    this.addEventListener('mousedown', this.handleMouseEvent);
  }

  disconnectedCallback() {
    this.removeEventListener('mousedown', this.handleMouseEvent);
    super.disconnectedCallback();
  }

  protected async updated(changedProperties: any) {
    super.updated(changedProperties);
    await this.updateComplete;

    if (changedProperties.has('href')) {
      this.isExternalLink = this.checkExternalLink(this.href || '');
      this.link = this.getLink(this.href);
    }
  }

  render() {
    return html`
      <a href=${this.link} @click=${this.preventClickEvent}>
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
  private handleMouseEvent = (event: MouseEvent) => {
    // 네비게이션 이벤트가 아닌 경우는 처리하지 않습니다.
    const isNonNavigationClick = event.button === 2 || event.metaKey || event.shiftKey || event.altKey;
    if (event.defaultPrevented || isNonNavigationClick) return;

    event.preventDefault();
    event.stopPropagation(); 
    const basepath = window.history.state?.basepath || '';

    if (event.button === 1 || event.ctrlKey) {
      // 마우스 중간 버튼 또는 Ctrl 키를 누르면 새 탭에서 열립니다.
      window.open(this.link, '_blank');
    } else if (!this.href) {
      // href 속성이 없으면 basepath로 이동합니다.
      this.dispatchPopstate(basepath, basepath);
    } else if (this.isExternalLink ||
      (this.href.startsWith("/") && !this.href.startsWith(basepath))) {
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
      const url =combinePath(basepath, this.href);
      this.dispatchPopstate(basepath, url);
    }
  }

  /**
   * 클라이언트 라우팅을 위해 popstate 이벤트를 발생시킵니다.
   */
  private dispatchPopstate(basepath: string, url: string) {
    window.history.pushState({ basepath: basepath }, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  /**
   * 클라이언트 라우팅을 위해 hashchange 이벤트를 발생시킵니다.
   * - 해시이벤트를 받으면 현재 페이지에서 해당 태그위치로 스크롤합니다.
   * - 스크롤 조절은 따로 구현해야 합니다.
   */
  private dispatchHashchange(basepath: string, url: string) {
    window.history.pushState({ basepath: basepath }, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  /**
   * link로 사용할 URL을 반환합니다.
   */
  private getLink(href?: string) {
    const basepath = window.history.state?.basepath || '';
    if (!href) {
      return window.location.origin + basepath;
    } else if (this.isExternalLink || href.startsWith('/') ||
      href.startsWith('#') ||  href.startsWith('?')) {
      return href;
    } else {
      return combinePath(basepath, href);
    }
  }

  /**
   * 기본 a 태그의 클릭 이벤트를 막습니다.
   */
  private preventClickEvent = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * 외부 링크인지 확인합니다.
   */
  private checkExternalLink(href: string) {
    return ULink.externalLinks.some((pattern) => pattern.test(href));
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

export const Link = createComponent({
  react: React as any,
  tagName: 'u-link',
  elementClass: ULink,
});
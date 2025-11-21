import { LitElement, RootPart, html, render } from 'lit';
import { createRoot, Root } from 'react-dom/client';
import type { TemplateResult } from 'lit';
import type { ReactElement } from 'react';
import type { RenderResult } from '../types/RouteConfig';

interface RenderOption {
  id?: string;
  force?: boolean;
  content: RenderResult;
}

/**
 * 라우트 아웃렛 컴포넌트
 * 라우트 설정에 따라 LitElement 또는 React 컴포넌트를 렌더링합니다.
 */
export class Outlet extends LitElement {
  private routeId?: string;
  private container?: HTMLDivElement;
  private content?: Root | RootPart;

  /** 쉐도우를 사용하지 않고, 직접 렌더링합니다. */
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`${this.container}`;
  }

  /**
   * render 함수의 결과를 렌더링합니다.
   * - HTMLElement, ReactElement, TemplateResult를 모두 처리할 수 있습니다.
   */
  public async renderContent({ id, content, force }: RenderOption) {
    if (this.routeId === id && force === false && this.container) {
      return this.container;
    }

    this.routeId = id;
    this.clear();
    
    if (!this.container) {
      throw new Error('Outlet container is not initialized.');
    }
    if (typeof content !== 'object') {
      throw new Error('Content is not a valid renderable object.');
    }

    if (content instanceof HTMLElement) {
      // HTMLElement인 경우 직접 추가
      this.container.appendChild(content);
    } else if ("_$litType$" in content) {
      // TemplateResult인 경우
      this.content = render(content as TemplateResult<1>, this.container);
    } else if ('$$typeof' in content) {
      // ReactElement인 경우
      this.content = createRoot(this.container);
      this.content.render(content as ReactElement);
    } else {
      throw new Error('not supported content type for Outlet rendering.');
    }

    this.requestUpdate();
    await this.updateComplete;
    return this.container!;
  }

  /**
   * 기존 DOM을 라이프 사이클에 맞게 제거합니다.
   */
  public clear() {
    if (this.content) {
      // React DOM이 렌더링된 경우
      if ('unmount' in this.content) {
        this.content.unmount();
      }
      // LitElement가 렌더링된 경우
      if ('setConnected' in this.content) {
        this.content.setConnected(false);
      }
      this.content = undefined;
    }
    // Container 초기화 - display: contents로 레이아웃에 영향을 주지 않음
    this.container = document.createElement('div');
    this.container.style.display = 'contents';
  }
}
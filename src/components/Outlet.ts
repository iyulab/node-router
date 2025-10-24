import { LitElement, RootPart, html, render } from 'lit';
import { customElement } from 'lit/decorators.js';
import { createElement, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { createComponent } from '@lit/react';
import React from 'react';

interface RenderOption {
  id?: string;
  force?: boolean;
}

interface RenderElementOption extends RenderOption {
  element: typeof LitElement | string;
}

interface RenderComponentOption extends RenderOption {
  component: ComponentType;
}

@customElement('u-outlet')
export class UOutlet extends LitElement {

  private routeId?: string;
  private root?: HTMLDivElement;
  private reactRoot?: ReturnType<typeof createRoot>;
  private litRoot?: RootPart;

  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      ${this.root}
    `;
  }

  /**
   * 기존 렌더링된 DOM을 제거하고, LitElement를 삽입합니다.
   * - 이전 ID와 동일하고, 강제 렌더링이 아닌 경우, 이전 DOM을 반환합니다.
   */
  public async renderElement({ id, element, force }: RenderElementOption) {
    if (this.routeId === id && !force) {
      return this.root?.firstElementChild;
    }
    this.routeId = id;
    this.clearRoot();
    const template = typeof element === 'string'
      ? document.createElement(element)
      : element.prototype instanceof LitElement
      ? new element()
      : undefined;
    if (!template || !this.root) {
      throw new Error('DOM이 초기화되지 않았습니다.');
    }
    this.litRoot = render(html`${template}`, this.root);
    this.requestUpdate();
    await this.updateComplete;
    return template;
  }

  /**
   * 기존 렌더링된 DOM을 제거하고, React 컴포넌트를 삽입합니다.
   * - 이전 ID와 동일하고, 강제 렌더링이 아닌 경우, 이전 DOM을 반환합니다.
   */
  public async renderComponent({ id, component, force }: RenderComponentOption) {
    if (this.routeId === id && !force) {
      return this.root;
    }
    this.routeId = id;
    this.clearRoot();
    const template = createElement(component);
    if (!template || !this.root) {
      throw new Error('DOM이 초기화되지 않았습니다.');
    }
    this.reactRoot = createRoot(this.root);
    this.reactRoot.render(template);
    this.requestUpdate();
    await this.updateComplete;
    return this.root;
  }

  /**
   * 기존 DOM을 라이프 사이클에 맞게 제거합니다.
   */
  public clearRoot() {
    // React DOM이 렌더링된 경우
    if(this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = undefined;
    }
    // LitElement가 렌더링된 경우
    if (this.litRoot) {
      this.litRoot.setConnected(false);
      this.litRoot = undefined;
    }
    // Root 초기화
    this.root = document.createElement('div');
    this.root.style.width = '100%';
    this.root.style.height = '100%';
  }
}

export const Outlet = createComponent({
  react: React as any,
  tagName: 'u-outlet',
  elementClass: UOutlet,
});
import { LitElement, RootPart, html, render } from 'lit';
import { createElement, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

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

/**
 * 라우트 아웃렛 컴포넌트
 * 라우트 설정에 따라 LitElement 또는 React 컴포넌트를 렌더링합니다.
 */
export class Outlet extends LitElement {

  private routeId?: string;
  private container?: HTMLDivElement;

  private reactRoot?: ReturnType<typeof createRoot>;
  private litRoot?: RootPart;

  /** 쉐도우를 사용하지 않고, 직접 렌더링합니다. */
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`${this.container}`;
  }

  /**
   * 기존 렌더링된 DOM을 제거하고, LitElement를 삽입합니다.
   * - 이전 ID와 동일하고, 강제 렌더링이 아닌 경우, 이전 DOM을 반환합니다.
   */
  public async renderElement({ id, element, force }: RenderElementOption) {
    if (this.routeId === id && !force) {
      return this.container?.firstElementChild;
    }

    this.routeId = id;
    this.clear();
    const template = typeof element === 'string'
      ? document.createElement(element)
      : element.prototype instanceof LitElement
      ? new element()
      : undefined;
    if (!template || !this.container) {
      throw new Error('DOM이 초기화되지 않았습니다.');
    }
    this.litRoot = render(html`${template}`, this.container);

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
      return this.container;
    }

    this.routeId = id;
    this.clear();
    const template = createElement(component);
    if (!template || !this.container) {
      throw new Error('DOM이 초기화되지 않았습니다.');
    }
    this.reactRoot = createRoot(this.container);
    this.reactRoot.render(template);

    this.requestUpdate();
    await this.updateComplete;
    return this.container;
  }

  /**
   * 기존 DOM을 라이프 사이클에 맞게 제거합니다.
   */
  public clear() {
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
    // Container 초기화
    this.container = document.createElement('div');
    this.container.style.width = '100%';
    this.container.style.height = '100%';
  }
}
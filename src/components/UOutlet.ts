import { render as renderTemplate } from 'lit';
import type { TemplateResult, RootPart } from 'lit';
import { createRoot, Root } from 'react-dom/client';
import type { ReactElement } from 'react';

import type { RenderResult } from '../types/RouteConfig';

/** 렌더링 옵션 */
interface RenderOption {
  /** 교차 렌더링 방지 ID */
  id?: string;
  /** 강제 렌더링 여부 */
  force?: boolean;
  /** 렌더링할 값 */
  value: RenderResult;
}

/** 
 * LitElement 또는 React 컴포넌트를 렌더링해주는 웹컴포넌트 입니다. 
 */
export class UOutlet extends HTMLElement {
  /** 교차 렌더링 방지 id */
  private routeId?: string;
  /** 실제 렌더링 컨텐츠 */
  private root?: Root | RootPart;

  /**
   * 주어진 렌더링 옵션에 따라 컨텐츠를 렌더링합니다.
   */
  public render({ id, value, force }: RenderOption) {
    if (this.routeId === id && force === false) return;
    this.routeId = id;
    this.reset();
    
    if (typeof value !== 'object') {
      throw new Error('Content is not a valid renderable object.');
    }

    if (value instanceof HTMLElement) {
      // HTMLElement인 경우 직접 추가
      this.replaceChildren(value);
      this.root = undefined;
    } else if ("_$litType$" in value) {
      // TemplateResult인 경우
      this.root = renderTemplate(value as TemplateResult<1>, this);
    } else if ('$$typeof' in value) {
      // ReactElement인 경우
      this.root = createRoot(this);
      this.root.render(value as ReactElement);
    } else {
      throw new Error('not supported content type for Outlet rendering.');
    }
  }

  /**
   * 기존 DOM을 삭제하여, 초기 상태로 되돌립니다.
   */
  public reset() {
    // Lit-Element가 붙어있던 경우 강제 초기화
    if (this.root && '_$litPart$' in this) {
      delete this._$litPart$;
    }

    // React가 붙어있던 경우
    if (this.root && 'unmount' in this.root) {
      this.root.unmount();
    }

    // Dom 초기화
    this.root = undefined;
    this.innerHTML = "";
  }
}

customElements.define('u-outlet', UOutlet);

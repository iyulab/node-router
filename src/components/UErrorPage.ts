import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

import { RouteError } from '../types/RouteError.js';

/** 에러 아이콘 모음 로드 */
const icons = Object.entries(import.meta.glob('../assets/*.svg', { 
  eager: true,
  query: '?raw'
})).reduce((acc, [path, content]) => {
  const name = path.split('/').pop()?.replace('.svg', '') || '';
  acc[name] = (content as any).default as string;
  return acc;
}, {} as Record<string, string>);

/**
 * 라우터 에러 표시 컴포넌트
 * 라우팅 중 발생한 에러 정보를 사용자에게 보여줍니다.
 */
@customElement('u-error-page')
export class UErrorPage extends LitElement {

  /** 표시할 에러 정보 */
  @property({ type: Object }) error?: RouteError;

  render() {
    const error = this.error || this.getDefaultError();
    const icon = this.getErrorIcon(error.code);

    return html`
      <div class="icon">${unsafeHTML(icon)}</div>
      <div class="code">${error.code}</div>
      <div class="message">${error.message}</div>
    `;
  }

  /** 기본 에러 정보 반환 */
  private getDefaultError(): RouteError {
    return new RouteError(500, 'Something went wrong. Please try again or contact support if the problem persists.');
  }

  /** 에러 코드에 따른 기본 아이콘 반환 */
  private getErrorIcon(code: number | string) {
    const codeStr = String(code);
    const numericCode = typeof code === 'string' ? parseInt(code) : code;
    
    // 문자열 에러 코드 처리
    switch (codeStr) {
      case 'OUTLET_NOT_FOUND':
        return icons["box-seam"] || '📦';
      case 'CONTENT_LOAD_FAILED':
        return icons["wifi-off"] || '📡';
      case 'RENDER_FAILED':
        return icons["palette"] || '🎨';
    }
    
    // 숫자 에러 코드 처리
    switch (numericCode) {
      case 404:
        return icons["search"] || '🔍';
      case 403:
        return icons["ban"] || '🚫';
      case 401:
        return icons["person-lock"] || '🔐';
      case 429:
        return icons["stopwatch"] || '⏱️';
      case 503:
        return icons["wrench-adjustable"] || '🛠️';
      default:
        return icons["exclamation-triangle"] || '⚠️';
    }
  }

  static styles = css`
    :host {
      --route-icon-color: #4a5568;
      --route-code-color: #1a202c;
      --route-message-color: #718096;
    }
    :host-context([theme="dark"]) {
      --route-icon-color: #a0aec0;
      --route-code-color: #f7fafc;
      --route-message-color: #cbd5e0;
    }

    @media (prefers-color-scheme: dark) {
      :host {
        --route-icon-color: #a0aec0;
        --route-code-color: #f7fafc;
        --route-message-color: #cbd5e0;
      }
    }

    :host {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      width: 100%;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: auto;
      user-select: none;
    }

    .icon {
      display: contents;
      font-size: 6rem;
      color: var(--route-icon-color);
      opacity: 0.85;
    }

    svg {
      width: 1em;
      height: 1em;
      fill: currentColor;
    }

    .code {
      font-size: 2rem;
      font-weight: 700;
      margin: 1rem 0;
      color: var(--route-code-color);
      letter-spacing: -0.5px;
    }

    .message {
      font-size: 1rem;
      color: var(--route-message-color);
      max-width: 600px;
      line-height: 1.6;
    }
  `;
}
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { RouteError } from '../types/RouteError.js';

/**
 * 라우팅 중 발생한 에러 정보를 사용자에게 전달하기 위한 기본 컴포넌트 입니다.
 */
@customElement('u-error-page')
export class UErrorPage extends LitElement {

  /** 표시할 에러 정보 */
  @property({ type: Object }) error?: RouteError;

  render() {
    const error = this.error || this.getDefaultError();
    const icon = this.getErrorIcon(error.code);

    return html`
      <div class="icon">${icon}</div>
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
      case 'OUTLET_MISSING':
        return '📦';
      case 'CONTENT_LOAD_FAILED':
        return '📡';
      case 'CONTENT_RENDER_FAILED':
        return '🎨';
    }
    
    // 숫자 에러 코드 처리
    switch (numericCode) {
      case 404:
        return '🔍';
      case 403:
        return '🚫';
      case 401:
        return '🔐';
      case 429:
        return '⏱️';
      case 503:
        return '🛠️';
      default:
        return '⚠️';
    }
  }

  static styles = css`
    :host {
      --error-icon-color: #4a5568;
      --error-code-color: #1a202c;
      --error-message-color: #718096;
    }
    :host-context([theme="dark"]) {
      --error-icon-color: #a0aec0;
      --error-code-color: #f7fafc;
      --error-message-color: #cbd5e0;
    }

    @media (prefers-color-scheme: dark) {
      :host {
        --error-icon-color: #a0aec0;
        --error-code-color: #f7fafc;
        --error-message-color: #cbd5e0;
      }
    }

    :host {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: auto;
      user-select: none;
    }

    .icon {
      color: var(--error-icon-color);
      font-size: 6rem;
      opacity: 0.85;
    }

    .code {
      color: var(--error-code-color);
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 1rem 0;
    }

    .message {
      color: var(--error-message-color);
      font-size: 1rem;
      line-height: 1.6;
      max-width: 600px;
    }
  `;
}
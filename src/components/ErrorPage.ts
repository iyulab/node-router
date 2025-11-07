import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { RouteError } from '../types/RouteError.js';
import { styles } from './ErrorPage.styles.js';

/**
 * 라우터 에러 표시 컴포넌트
 * 라우팅 중 발생한 에러 정보를 사용자에게 보여줍니다.
 */
@customElement('u-error-page')
export class ErrorPage extends LitElement {
  static styles = styles;

  /** 표시할 에러 정보 */
  @property({ type: Object }) error?: RouteError;

  render() {
    const error = this.error || this.getDefaultError();
    const icon = this.getErrorIcon(error.code);

    return html`
      <div class="container" role="alert" aria-live="polite">
        <div class="icon" aria-hidden="true">${icon}</div>
        <div class="code" aria-label="Error code">${error.code}</div>
        <div class="message">${error.message}</div>
        
        <div class="actions">
          <button 
            class="button"
            @click=${this.handleGoBack}
            title="Go back to previous page"
            aria-label="Go back to previous page">
            ← Go Back
          </button>
          
          <button 
            class="button"
            @click=${this.handleRefresh}
            title="Refresh the current page"
            aria-label="Refresh the current page">
            🔄 Refresh
          </button>
        </div>
      </div>
    `;
  }

  /** 기본 에러 정보 반환 */
  private getDefaultError(): RouteError {
    return new RouteError(500, 'Something went wrong. Please try again or contact support if the problem persists.');
  }

  /** 에러 코드에 따른 기본 아이콘 반환 */
  private getErrorIcon(code: number | string): string {
    const numericCode = typeof code === 'string' ? parseInt(code) : code;
    
    switch (numericCode) {
      case 404:
        return '🔍';
      case 403:
        return '🔒';
      case 401:
        return '🔑';
      case 429:
        return '⏱️';
      case 503:
        return '🛠️';
      case 500:
      default:
        return '⚠️';
    }
  }

  /** 뒤로가기 */
  private handleGoBack() {
    window.history.back();
  }

  /** 새로고침 */
  private handleRefresh() {
    window.location.reload();
  }
}
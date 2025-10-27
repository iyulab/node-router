import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { styles } from './ErrorPage.styles.js';
import type { RouteError } from '../types/RouteError.js';

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
      <div class="container">
        <div class="icon" aria-hidden="true">${icon}</div>
        <div class="code">${error.code}</div>
        <div class="message">${error.message}</div>
        
        ${error.path 
          ? html`
            <div class="path">
              Path: <code>${error.path}</code>
            </div>` 
          : nothing}
        
        <div class="actions">
          <button 
            class="button button--primary"
            @click=${this.handleGoHome}
            type="button">
            🏠 Go Home
          </button>
          
          <button 
            class="button button--secondary"
            @click=${this.handleGoBack}
            type="button">
            ← Go Back
          </button>
          
          <button 
            class="button button--secondary"
            @click=${this.handleRefresh}
            type="button">
            🔄 Refresh
          </button>
        </div>
      </div>
    `;
  }

  /** 기본 에러 정보 반환 */
  private getDefaultError(): RouteError {
    return {
      code: 500,
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    };
  }

  /** 에러 코드에 따른 기본 아이콘 반환 */
  private getErrorIcon(code: number | string): string {
    switch (code) {
      case 404:
        return '🔍';
      case 403:
        return '🔒';
      case 500:
        return '⚠️';
      default:
        return '❌';
    }
  }

  /** 홈으로 이동 */
  private handleGoHome() {
    window.location.href = '/';
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
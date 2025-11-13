import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { RouteError } from '../types/RouteError.js';
import { styles } from './ErrorPage.styles.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

/** 에러 아이콘 모음 로드 */
const icons = Object.entries(import.meta.glob('../assets/*.svg', { as: 'raw', eager: true }))
  .reduce((acc, [path, content]) => {
    const name = path.split('/').pop()?.replace('.svg', '') || '';
    acc[name] = content;
    return acc;
  }, {} as Record<string, string>);

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
      case 'OUTLET_NOT_FOUND':
        return unsafeSVG(icons["box-seam"] || '📦');
      case 'CONTENT_LOAD_FAILED':
        return unsafeSVG(icons["wifi-off"] || '📡');
      case 'RENDER_FAILED':
        return unsafeSVG(icons["palette"] || '🎨');
    }
    
    // 숫자 에러 코드 처리
    switch (numericCode) {
      case 404:
        return unsafeSVG(icons["search"] || '🔍');
      case 403:
        return unsafeSVG(icons["ban"] || '🚫');
      case 401:
        return unsafeSVG(icons["person-lock"] || '🔐');
      case 429:
        return unsafeSVG(icons["stopwatch"] || '⏱️');
      case 503:
        return unsafeSVG(icons["wrench-adjustable"] || '🛠️');
      default:
        return unsafeSVG(icons["exclamation-triangle"] || '⚠️');
    }
  }
}
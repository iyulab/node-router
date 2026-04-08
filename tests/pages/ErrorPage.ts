import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { RouteError } from '../../src';

@customElement('error-page')
export class ErrorPage extends LitElement {

  @property({ type: Object })
  error: RouteError | null = null;

  render() {
    const code = this.error?.code ?? 'ERROR';
    const message = this.error?.message ?? 'Something went wrong';
    const isNotFound = code === 'NOT_FOUND';

    return html`
      <div class="card ${isNotFound ? 'not-found' : 'error'}">
        <div class="icon">${isNotFound ? '🔍' : '💥'}</div>
        <div class="code">${code}</div>
        <div class="message">${message}</div>
        <a href="/" class="back">← 홈으로</a>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; }
    .card {
      border-radius: 16px;
      padding: 3rem;
      text-align: center;
      color: white;
    }
    .not-found { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
    .error     { background: linear-gradient(135deg, #ef4444, #f97316); }
    .icon  { font-size: 3.5rem; margin-bottom: 1rem; }
    .code  { font-size: 1.4rem; font-weight: 800; opacity: 0.9; margin-bottom: 0.5rem; }
    .message { font-size: 1rem; opacity: 0.85; margin-bottom: 2rem; }
    .back {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      color: white;
      text-decoration: none;
      padding: 0.5rem 1.5rem;
      border-radius: 20px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .back:hover { background: rgba(255,255,255,0.35); }
  `;
}
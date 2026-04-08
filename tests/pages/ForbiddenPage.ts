import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('forbidden-page')
export class ForbiddenPage extends LitElement {
  render() {
    return html`
      <div class="card">
        <div class="icon">🚫</div>
        <div class="code">403 FORBIDDEN</div>
        <p>접근 권한이 없습니다.</p>
        <p class="hint">admin role이 필요한 페이지입니다. 우측 상단의 Role 토글로 admin으로 변경 후 다시 시도하세요.</p>
        <div class="actions">
          <a href="/">← 홈으로</a>
          <a href="/admin">Admin 재시도</a>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; max-width: 480px; margin: 2rem auto; }
    .card {
      background: linear-gradient(135deg, #f97316, #ef4444);
      border-radius: 16px;
      padding: 3rem 2.5rem;
      text-align: center;
      color: white;
    }
    .icon  { font-size: 3.5rem; margin-bottom: 1rem; }
    .code  { font-size: 1.3rem; font-weight: 800; opacity: 0.9; margin-bottom: 1rem; }
    p      { margin: 0.5rem 0; opacity: 0.9; }
    .hint  { font-size: 0.85rem; opacity: 0.75; margin-top: 0.75rem; }
    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 2rem;
    }
    a {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      color: white;
      text-decoration: none;
      padding: 0.5rem 1.2rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: background 0.2s;
    }
    a:hover { background: rgba(255,255,255,0.35); }
  `;
}

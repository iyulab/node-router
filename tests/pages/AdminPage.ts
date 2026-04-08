import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { auth } from '../auth';

@customElement('admin-page')
export class AdminPage extends LitElement {
  render() {
    return html`
      <div class="card">
        <div class="badge">👑 Admin Only</div>
        <h2>Admin Panel</h2>
        <p class="desc">
          Per-route enter로 보호된 페이지입니다.
          <code>role === 'admin'</code>이면 통과, 아니면 <code>/forbidden</code>으로 redirect합니다.
        </p>

        <div class="access-info">
          <div class="row">
            <span class="key">현재 role</span>
            <span class="val role-${auth.role}">${auth.role}</span>
          </div>
          <div class="row">
            <span class="key">enter 조건</span>
            <span class="val code">() => auth.role === 'admin' || '/forbidden'</span>
          </div>
        </div>

        <div class="code-block">
          <div class="code-title">라우트 설정 예시</div>
          <pre><code>{
  path: '/admin',
  metadata: { requiresAuth: true, role: 'admin' },
  enter: () => auth.role === 'admin' || '/forbidden',
  render: () => html\`&lt;admin-page&gt;&lt;/admin-page&gt;\`,
}</code></pre>
        </div>

        <div class="tip">
          🔄 우측 상단 Role 토글을 <strong>user</strong>로 변경한 후 다시 <code>/admin</code>에 접근해보세요.
          per-route enter가 <code>/forbidden</code>으로 redirect합니다.
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; }
    .card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .badge {
      display: inline-block;
      background: #fef3c7;
      color: #b45309;
      padding: 0.3rem 0.9rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    h2 { margin: 0 0 0.5rem; color: #111; }
    .desc { color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem; }
    code { background: #fef3c7; padding: 1px 5px; border-radius: 3px; font-size: 0.85em; color: #92400e; }
    .access-info {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .row { display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem; }
    .row:last-child { margin-bottom: 0; }
    .key { font-size: 0.8rem; font-weight: 600; color: #92400e; width: 100px; }
    .val { font-family: monospace; font-size: 0.85rem; }
    .val.code { background: #fef3c7; padding: 2px 6px; border-radius: 4px; color: #92400e; }
    .role-admin { color: #d97706; font-weight: 700; }
    .role-user  { color: #6b7280; font-weight: 700; }
    .code-block { margin-bottom: 1.5rem; }
    .code-title { font-size: 0.75rem; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 0.4rem; }
    pre {
      margin: 0;
      background: #1e1e2e;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
      color: #cdd6f4;
      font-size: 0.82rem;
      line-height: 1.6;
    }
    .tip {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      color: #166534;
      line-height: 1.6;
    }
    .tip strong { color: #15803d; }
  `;
}

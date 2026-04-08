import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { auth } from '../auth';

@customElement('login-page')
export class LoginPage extends LitElement {
  @state() private _role: 'user' | 'admin' = 'user';

  private login() {
    auth.isAuthenticated = true;
    auth.role = this._role;
    window.navigation.reload();
  }

  render() {
    return html`
      <div class="card">
        <div class="icon">🔐</div>
        <h2>Login</h2>
        <p class="desc">글로벌 enter에 의해 redirect된 페이지입니다.<br>role을 선택하고 로그인하면 enter 동작을 확인할 수 있습니다.</p>

        <div class="field">
          <label>Role 선택</label>
          <div class="role-group">
            <button
              class="role-btn ${this._role === 'user' ? 'selected' : ''}"
              @click=${() => { this._role = 'user'; }}
            >
              👤 user
            </button>
            <button
              class="role-btn ${this._role === 'admin' ? 'selected' : ''}"
              @click=${() => { this._role = 'admin'; }}
            >
              👑 admin
            </button>
          </div>
        </div>

        <button class="login-btn" @click=${this.login}>
          로그인 (as ${this._role})
        </button>

        <div class="info">
          <p>• <code>user</code>: 일반 페이지 접근 가능, <code>/admin</code> 접근 시 per-route enter로 /forbidden 이동</p>
          <p>• <code>admin</code>: 모든 페이지 접근 가능</p>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; max-width: 460px; margin: 2rem auto; }
    .card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      text-align: center;
    }
    .icon { font-size: 3rem; margin-bottom: 0.75rem; }
    h2  { margin: 0 0 0.5rem; color: #111; }
    .desc { color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem; }
    .field { margin-bottom: 1.5rem; text-align: left; }
    label { display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
    .role-group { display: flex; gap: 0.5rem; }
    .role-btn {
      flex: 1;
      padding: 0.6rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.15s;
    }
    .role-btn.selected {
      border-color: #6366f1;
      background: #eef2ff;
      color: #4338ca;
      font-weight: 700;
    }
    .login-btn {
      width: 100%;
      padding: 0.75rem;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      margin-bottom: 1.5rem;
      transition: background 0.2s;
    }
    .login-btn:hover { background: #4f46e5; }
    .info {
      text-align: left;
      background: #f9fafb;
      border-radius: 8px;
      padding: 1rem;
    }
    .info p { margin: 0.25rem 0; font-size: 0.8rem; color: #6b7280; }
    code { background: #e5e7eb; padding: 1px 4px; border-radius: 3px; color: #374151; }
  `;
}

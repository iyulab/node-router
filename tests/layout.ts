import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { RouteContext, RouteBeginEvent, RouteDoneEvent, RouteErrorEvent, RouteProgressEvent } from '../src';
import { auth } from './auth';

@customElement('preview-layout')
export class PreviewLayout extends LitElement {
  @state() context?: RouteContext;
  @state() progress: number = 0;
  @state() private _isAuthenticated = auth.isAuthenticated;
  @state() private _role: 'user' | 'admin' = auth.role;
  @state() private _eventLog: string[] = [];

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('route-begin', this.handleRouteBegin);
    window.addEventListener('route-done', this.handleRouteDone);
    window.addEventListener('route-progress', this.handleRouteProgress);
    window.addEventListener('route-error', this.handleRouteError);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('route-begin', this.handleRouteBegin);
    window.removeEventListener('route-done', this.handleRouteDone);
    window.removeEventListener('route-progress', this.handleRouteProgress);
    window.removeEventListener('route-error', this.handleRouteError);
  }

  private get navGroups() {
    return [
      {
        label: '공개',
        links: [
          { href: '/', label: 'Home' },
          { href: '/login', label: 'Login' },
          { href: '/forbidden', label: 'Forbidden' },
        ],
      },
      {
        label: '인증 필요',
        links: [
          { href: '/params', label: 'Params' },
          { href: '/params/hello', label: 'Params/hello' },
          { href: '/params/hello?page=1&size=10#section', label: 'Params full' },
          { href: '/async', label: 'Async' },
        ],
      },
      {
        label: 'Admin',
        links: [
          { href: '/admin', label: 'Admin Panel' },
        ],
      },
      {
        label: 'Nested',
        links: [
          { href: '/nested', label: 'Overview' },
          { href: '/nested/lit', label: 'Lit' },
          { href: '/nested/react', label: 'React' },
          { href: '/nested/deep', label: 'Deep' },
          { href: '/nested/deep/item-1', label: 'Deep/item-1' },
          { href: '/nested/deep/item-2', label: 'Deep/item-2' },
        ],
      },
      {
        label: '기타',
        links: [
          { href: '/error', label: 'Error' },
          { href: '/not-found', label: '404' },
        ],
      },
    ];
  }

  render() {
    return html`
      <header>
        <div class="nav-groups">
          ${repeat(this.navGroups, g => g.label, g => html`
            <div class="nav-group">
              <span class="group-label">${g.label}</span>
              ${repeat(g.links, l => l.href, l => {
                const isActive = l.href === this.context?.pathname ||
                  (l.href !== '/' && this.context?.pathname?.startsWith(l.href.split('?')[0]));
                return html`
                  <u-link class="link" href=${l.href} ?active=${isActive}>
                    ${l.label}
                  </u-link>
                `;
              })}
            </div>
          `)}
        </div>
      </header>

      <div class="body">
        <div class="viewport">
          <u-outlet></u-outlet>
        </div>

        <div class="sidebar">
          <div class="panel">
            <div class="panel-title">Auth</div>
            <div class="auth-row">
              <button
                class="toggle ${this._isAuthenticated ? 'on' : 'off'}"
                @click=${this.toggleAuth}
              >
                ${this._isAuthenticated ? '🔓 로그인됨' : '🔒 로그아웃'}
              </button>
              <button
                class="toggle ${this._role === 'admin' ? 'admin' : 'user'}"
                @click=${this.toggleRole}
                ?disabled=${!this._isAuthenticated}
              >
                👤 ${this._role}
              </button>
            </div>
            <div class="progress-wrap">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${this.progress}%"></div>
              </div>
              <span class="progress-label">${this.progress}%</span>
            </div>
          </div>
          <div class="panel">
            <div class="panel-title">Metadata</div>
            <pre class="code">${JSON.stringify(this.context?.metadata ?? {}, null, 2)}</pre>
          </div>
          <div class="panel">
            <div class="panel-title">Event Log</div>
            <div class="log">
              ${repeat(this._eventLog, (_, i) => i, e => html`<div class="log-entry">${e}</div>`)}
              ${this._eventLog.length === 0 ? html`<div class="log-empty">이벤트 없음</div>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private toggleAuth() {
    auth.isAuthenticated = !auth.isAuthenticated;
    this._isAuthenticated = auth.isAuthenticated;
  }

  private toggleRole() {
    auth.role = auth.role === 'user' ? 'admin' : 'user';
    this._role = auth.role;
  }

  private log(msg: string) {
    const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
    this._eventLog = [`[${time}] ${msg}`, ...this._eventLog].slice(0, 20);
  }

  private handleRouteBegin = (e: Event) => {
    const { context } = e as RouteBeginEvent;
    this.progress = 0;
    this.log(`BEGIN → ${context.pathname}`);
  };

  private handleRouteDone = (e: Event) => {
    const { context } = e as RouteDoneEvent;
    this.context = context;
    this._isAuthenticated = auth.isAuthenticated;
    this._role = auth.role;
    this.progress = 100;
    this.log(`DONE  → ${context.pathname}`);
  };

  private handleRouteProgress = (e: Event) => {
    const { progress } = e as RouteProgressEvent;
    this.progress = progress;
  };

  private handleRouteError = (e: Event) => {
    const { error } = e as RouteErrorEvent;
    this.log(`ERROR → ${error?.message ?? 'unknown'}`);
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100vw;
      height: 100vh;
      background: #f0f2f5;
      font-family: system-ui, sans-serif;
      font-size: 14px;
    }

    header {
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
      padding: 0.75rem 1rem;
    }

    .nav-groups {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }

    .nav-group {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0 0.5rem;
      border-left: 2px solid #e0e0e0;
    }
    .nav-group:first-child { border-left: none; }

    .group-label {
      font-size: 0.7rem;
      color: #999;
      font-weight: 600;
      text-transform: uppercase;
      margin-right: 0.25rem;
    }

    .link {
      color: #444;
      text-decoration: none;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
      transition: background 0.15s;
    }
    .link:hover { background: #f0f0f0; }
    .link[active] { background: #3b82f6; color: white; }

    .toggle {
      border: none;
      border-radius: 20px;
      padding: 0.3rem 0.9rem;
      font-size: 0.8rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }
    .toggle.off  { background: #fee2e2; color: #dc2626; }
    .toggle.on   { background: #dcfce7; color: #16a34a; }
    .toggle.user  { background: #e0f2fe; color: #0284c7; }
    .toggle.admin { background: #fef3c7; color: #d97706; }
    .toggle:disabled { opacity: 0.4; cursor: not-allowed; }

    .auth-row {
      display: flex;
      gap: 0.4rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .progress-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: #3b82f6;
      transition: width 0.2s;
      border-radius: 4px;
    }
    .progress-label {
      font-size: 0.7rem;
      color: #6b7280;
      white-space: nowrap;
    }

    .body {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .viewport {
      flex: 1;
      padding: 1.25rem;
      overflow: auto;
    }

    .sidebar {
      width: 260px;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      overflow: auto;
      border-left: 1px solid #e5e7eb;
      background: #fafafa;
    }

    .panel {
      background: white;
      border-radius: 8px;
      padding: 0.75rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }

    .panel-title {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 0.5rem;
      letter-spacing: 0.05em;
    }

    .code {
      margin: 0;
      font-size: 0.75rem;
      background: #f3f4f6;
      padding: 0.5rem;
      border-radius: 4px;
      white-space: pre-wrap;
      word-break: break-all;
      color: #374151;
    }

    .log {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 200px;
      overflow-y: auto;
    }

    .log-entry {
      font-family: monospace;
      font-size: 0.7rem;
      color: #374151;
      padding: 2px 4px;
      border-radius: 2px;
      background: #f9fafb;
    }
    .log-entry:first-child { background: #eff6ff; color: #1d4ed8; }

    .log-empty {
      font-size: 0.75rem;
      color: #9ca3af;
      text-align: center;
      padding: 0.5rem;
    }
  `;
}

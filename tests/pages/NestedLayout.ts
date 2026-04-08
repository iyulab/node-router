import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * /nested 경로의 부모 레이아웃
 * <u-outlet>을 포함하여 자식 라우트를 렌더링합니다.
 */
@customElement('nested-layout')
export class NestedLayout extends LitElement {
  render() {
    return html`
      <div class="container">
        <div class="header">
          <span class="badge">2-level Nested</span>
          <h2>Nested Route Layout</h2>
          <p class="desc">
            이 레이아웃은 부모 라우트 <code>/nested</code>에서 한 번 렌더링되며,
            자식 경로가 변경되어도 유지됩니다. (force=false)
          </p>
        </div>

        <nav class="tabs">
          <a href="/nested" class="tab">Overview</a>
          <a href="/nested/lit" class="tab">Lit</a>
          <a href="/nested/react" class="tab">React</a>
          <a href="/nested/deep" class="tab">Deep (3-level)</a>
        </nav>

        <div class="outlet-wrapper">
          <u-outlet></u-outlet>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      padding: 1.5rem 1.5rem 0;
    }
    .badge {
      display: inline-block;
      background: #d1fae5;
      color: #065f46;
      padding: 0.2rem 0.8rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    h2 { margin: 0 0 0.4rem; color: #111; }
    .desc { color: #6b7280; font-size: 0.85rem; margin: 0 0 1rem; line-height: 1.5; }
    code { background: #d1fae5; padding: 1px 4px; border-radius: 3px; color: #065f46; font-size: 0.85em; }
    .tabs {
      display: flex;
      gap: 0;
      border-bottom: 2px solid #e5e7eb;
      padding: 0 1.5rem;
    }
    .tab {
      padding: 0.6rem 1rem;
      text-decoration: none;
      color: #6b7280;
      font-size: 0.85rem;
      font-weight: 600;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: all 0.15s;
    }
    .tab:hover { color: #10b981; }
    .outlet-wrapper {
      padding: 1.25rem;
      min-height: 120px;
    }
  `;
}

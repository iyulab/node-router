import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('nested-index-page')
export class NestedIndexPage extends LitElement {
  render() {
    return html`
      <div class="card">
        <h3>Nested Overview (index route)</h3>
        <p>
          <code>index: true</code> 라우트입니다. <code>/nested</code>에 직접 접근하면 이 페이지가
          <code>&lt;nested-layout&gt;</code>의 <code>&lt;u-outlet&gt;</code> 안에 렌더링됩니다.
        </p>
        <div class="links">
          <a href="/nested/lit">Lit 자식 페이지로 이동 →</a>
          <a href="/nested/react">React 자식 페이지로 이동 →</a>
          <a href="/nested/deep">Deep 중첩(3-level)으로 이동 →</a>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; }
    .card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 1.25rem;
    }
    h3 { margin: 0 0 0.5rem; color: #065f46; }
    p  { margin: 0 0 1rem; color: #047857; font-size: 0.9rem; line-height: 1.5; }
    code { background: #d1fae5; padding: 1px 4px; border-radius: 3px; color: #064e3b; font-size: 0.85em; }
    .links { display: flex; flex-direction: column; gap: 0.4rem; }
    a { color: #059669; font-size: 0.85rem; text-decoration: none; }
    a:hover { text-decoration: underline; }
  `;
}

import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('nested-lit-page')
export class NestedLitPage extends LitElement {
  render() {
    return html`
      <div class="card">
        <div class="badge">Lit Element</div>
        <h3>Nested Lit Component</h3>
        <p>2-level 중첩 라우트의 Lit 자식 컴포넌트입니다.</p>
        <p>부모 <code>&lt;nested-layout&gt;</code> 안의 <code>&lt;u-outlet&gt;</code>에 렌더링됩니다.</p>
        <div class="info">
          <span>Current path: <code>/nested/lit</code></span>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; }
    .card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 1.5rem;
    }
    .badge {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 0.2rem 0.8rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    h3 { margin: 0 0 0.5rem; color: #1d4ed8; }
    p  { margin: 0.4rem 0; color: #3730a3; font-size: 0.9rem; }
    .info { margin-top: 1rem; font-size: 0.85rem; color: #6b7280; }
    code {
      background: #dbeafe;
      padding: 1px 4px;
      border-radius: 3px;
      color: #1e40af;
    }
  `;
}
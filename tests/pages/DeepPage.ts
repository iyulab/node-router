import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('deep-page')
export class DeepPage extends LitElement {

  @property({ type: String })
  itemId?: string;

  render() {
    return html`
      <div class="card">
        <div class="id-badge">${this.itemId}</div>
        <h4>Deep Item: <code>${this.itemId}</code></h4>
        <p>3-level 중첩 라우트 <code>/nested/deep/:id</code>의 아이템 페이지입니다.</p>
        <p class="hint">
          <code>nested-layout</code> → <code>deep-layout</code> 은 유지된 채로
          이 컴포넌트만 교체됩니다. (force=true)
        </p>
        <div class="nav">
          ${['item-1', 'item-2', 'item-3'].filter(i => i !== this.itemId).map(id => html`
            <a href="/nested/deep/${id}">${id}로 이동</a>
          `)}
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; }
    .card {
      background: white;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 1rem;
    }
    .id-badge {
      display: inline-block;
      background: #f59e0b;
      color: white;
      padding: 0.2rem 0.75rem;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    h4 { margin: 0 0 0.4rem; color: #92400e; }
    p  { margin: 0.3rem 0; color: #b45309; font-size: 0.85rem; line-height: 1.5; }
    .hint { color: #9ca3af; font-size: 0.8rem; }
    code { background: #fef3c7; padding: 1px 4px; border-radius: 3px; color: #78350f; font-size: 0.85em; }
    .nav { margin-top: 0.75rem; display: flex; gap: 0.5rem; }
    a {
      padding: 0.3rem 0.7rem;
      background: #fef3c7;
      color: #b45309;
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      transition: background 0.15s;
    }
    a:hover { background: #fde68a; }
  `;
}

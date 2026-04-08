import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('deep-index-page')
export class DeepIndexPage extends LitElement {
  render() {
    return html`
      <div class="card">
        <h4>Deep Overview (index route)</h4>
        <p>3-level 중첩 라우트의 index입니다. 위 버튼으로 항목을 선택하세요.</p>
        <p class="hint">
          이 페이지는 <code>nested-layout</code> → <code>deep-layout</code> → <code>deep-index-page</code>
          3단계 outlet 체인으로 렌더링됩니다.
        </p>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; }
    .card {
      background: white;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 1rem;
    }
    h4 { margin: 0 0 0.4rem; color: #92400e; }
    p  { margin: 0.3rem 0; color: #b45309; font-size: 0.85rem; line-height: 1.5; }
    .hint { color: #9ca3af; font-size: 0.8rem; }
    code { background: #fef3c7; padding: 1px 4px; border-radius: 3px; color: #78350f; font-size: 0.85em; }
  `;
}

import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * /nested/deep 경로의 3번째 레벨 레이아웃
 * nested-layout > deep-layout > (index or :id) 구조
 */
@customElement('deep-layout')
export class DeepLayout extends LitElement {
  render() {
    return html`
      <div class="container">
        <div class="header">
          <span class="badge">3-level Deep</span>
          <h3>Deep Nested Layout</h3>
          <p class="desc">
            3단계 중첩 라우트입니다. <code>/nested</code> → <code>/nested/deep</code> → <code>/nested/deep/:id</code>
          </p>
        </div>

        <div class="items">
          <a href="/nested/deep" class="item">Overview</a>
          <a href="/nested/deep/item-1" class="item">Item 1</a>
          <a href="/nested/deep/item-2" class="item">Item 2</a>
          <a href="/nested/deep/item-3" class="item">Item 3</a>
        </div>

        <div class="outlet-wrapper">
          <u-outlet></u-outlet>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; }
    .container {
      background: #fefce8;
      border: 1px solid #fde68a;
      border-radius: 10px;
      overflow: hidden;
    }
    .header { padding: 1rem 1rem 0; }
    .badge {
      display: inline-block;
      background: #fde68a;
      color: #92400e;
      padding: 0.15rem 0.7rem;
      border-radius: 10px;
      font-size: 0.72rem;
      font-weight: 700;
      margin-bottom: 0.4rem;
    }
    h3 { margin: 0 0 0.3rem; color: #92400e; font-size: 1rem; }
    .desc { margin: 0 0 0.75rem; color: #b45309; font-size: 0.82rem; line-height: 1.5; }
    code { background: #fde68a; padding: 1px 4px; border-radius: 3px; color: #78350f; font-size: 0.85em; }
    .items {
      display: flex;
      gap: 0.4rem;
      padding: 0 1rem 0.75rem;
      flex-wrap: wrap;
    }
    .item {
      padding: 0.3rem 0.8rem;
      background: white;
      border: 1px solid #fbbf24;
      color: #b45309;
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      transition: all 0.15s;
    }
    .item:hover { background: #fef3c7; }
    .outlet-wrapper {
      padding: 0.75rem;
      border-top: 1px solid #fde68a;
    }
  `;
}

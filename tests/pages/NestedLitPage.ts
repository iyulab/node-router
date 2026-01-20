import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('nested-lit-page')
export class NestedLitPage extends LitElement {
  render() {
    return html`
      <h3>🎨 Nested Content <span class="badge">Lit</span></h3>
      <p>This is a Lit component rendered inside a nested outlet!</p>
      <p>Parent layout + Lit child content working correctly. ✅</p>
      <p><strong>Framework:</strong> Lit Element</p>
    `;
  }

  static styles = css`
    :host {
      display: block;
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 8px;
      margin-top: 1rem;
    }

    h3 {
      margin: 0 0 1rem 0;
      color: #1976d2;
    }

    .badge {
      display: inline-block;
      background: #1976d2;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: bold;
      margin-left: 0.5rem;
    }

    p {
      margin: 0.5rem 0;
      color: #555;
    }
  `;
}

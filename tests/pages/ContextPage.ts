import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { RouteContext } from '../../src';

@customElement('context-page')
export class ContextPage extends LitElement {

  @property({ type: Object }) 
  ctx: RouteContext | null = null;

  render() {
    if (!this.ctx) {
      return html`
        <div>
          <h2>Route Context Viewer</h2>
          <p>No route context available</p>
        </div>
      `;
    }

    const queryObj: Record<string, string> = {};
    this.ctx.query?.forEach((value: string, key: string) => {
      queryObj[key] = value;
    });

    return html`
      <div>
        <h2>Route Context Viewer</h2>

        <div class="section">
          <h3>Path Information</h3>
          <div class="item">
            <strong>Pathname:</strong>
            <code>${this.ctx.pathname}</code>
          </div>
          <div class="item">
            <strong>Hash:</strong>
            <code>${this.ctx.hash || '(empty)'}</code>
          </div>
          <div class="item">
            <strong>Query:</strong>
            <code>${this.ctx.query || '(empty)'}</code>
          </div>
        </div>

        <div class="section">
          <h3>Parameters</h3>
          <div class="item">
            <code><pre>${JSON.stringify(this.ctx.params, null, 2)}</pre></code>
          </div>
        </div>

        <div class="section">
          <h3>Query Parameters</h3>
          <div class="item">
            <code><pre>${JSON.stringify(queryObj, null, 2)}</pre></code>
          </div>
        </div>

        <div class="section">
          <h3>Full Context Object</h3>
          <div class="item">
            <code><pre>${JSON.stringify({
              pathname: this.ctx.pathname,
              hash: this.ctx.hash,
              search: this.ctx.query,
              params: this.ctx.params,
              query: queryObj,
            }, null, 2)}</pre></code>
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    h2 {
      margin: 0 0 1.5rem 0;
      color: #333;
    }

    .section {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      border-left: 4px solid #007bff;
    }

    .section h3 {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 0.9rem;
      text-transform: uppercase;
    }

    .item {
      margin: 0.5rem 0;
      display: flex;
      gap: 1rem;
    }

    .item strong {
      min-width: 100px;
      color: #333;
    }

    .item code {
      background: white;
      padding: 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      flex: 1;
      display: block;
    }

    pre {
      background: white;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      margin: 0;
    }
  `;
}

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { RouteContext } from '../../src';

@customElement('context-page')
export class ContextPage extends LitElement {

  @property({ type: Object }) 
  context: RouteContext | null = null;

  render() {
    if (!this.context) {
      return html`
        <div>
          <h2>Route Context Viewer</h2>
          <p>No route context available</p>
        </div>
      `;
    }

    return html`
      <div>
        <h2>Route Context Viewer</h2>

        <div class="section buttons">
          <h3>컨트롤 버튼</h3>
          <div class="button-group">
            <button @click=${() => this.navigateParams()}>Change Params</button>
            <button @click=${() => this.navigateQuery()}>Add Query</button>
            <button @click=${() => this.navigateHash()}>Add Hash</button>
            <button @click=${() => this.navigate('/context/john?page=1#profile')}>Full Example</button>
          </div>
        </div>

        <div class="section">
          <h3>컨텍스트 뷰어</h3>
          <div class="item">
            <code><pre>${this.serialize()}</pre></code>
          </div>
        </div>
      </div>
    `;
  }

  private navigate(path: string) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  private navigateParams() {
    const ids = ['john', 'jane', 'admin', 'guest'];
    const randomId = ids[Math.floor(Math.random() * ids.length)];
    this.navigate(`/context/${randomId}`);
  }

  private navigateQuery() {
    const randomParam = `param${Math.floor(Math.random() * 100)}`;
    const randomValue = `value${Math.floor(Math.random() * 100)}`;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set(randomParam, randomValue);
    this.navigate(currentUrl.pathname + currentUrl.search + currentUrl.hash);
  }

  private navigateHash() {
    const hashes = ['section1', 'section2', 'profile', 'settings', 'about'];
    const randomHash = hashes[Math.floor(Math.random() * hashes.length)];
    const currentUrl = new URL(window.location.href);
    this.navigate(currentUrl.pathname + currentUrl.search + '#' + randomHash);
  }

  private serialize() {
    if (!this.context) return '{}';
    
    const serializable = {
      href: this.context.href,
      origin: this.context.origin,
      basepath: this.context.basepath,
      path: this.context.path,
      pathname: this.context.pathname,
      params: this.context.params,
      query: Object.fromEntries(this.context.query.entries()),
      hash: this.context.hash,
    };
    
    return JSON.stringify(serializable, null, 2);
  }

  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    h2 {
      margin: 0 0 1.5rem 0;
      color: #333;
      font-size: 1.8rem;
    }

    .section {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      border-left: 4px solid #007bff;
    }

    .section.buttons {
      border-left-color: #28a745;
    }

    .section h3 {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    button {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    button:hover {
      background: #0056b3;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
    }
    button:active {
      transform: translateY(0);
    }

    .item {
      margin: 0.5rem 0;
    }

    .item code {
      background: white;
      padding: 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      display: block;
      margin-top: 0.25rem;
      word-break: break-all;
    }

    pre {
      background: white;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      margin: 0;
      font-size: 0.85rem;
      line-height: 1.5;
    }
  `;
}

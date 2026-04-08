import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RouteContext } from '../../src';

@customElement('params-page')
export class ParamsPage extends LitElement {

  @property({ type: Object })
  context: RouteContext | null = null;

  render() {
    if (!this.context) return html`<div>No context</div>`;

    const ctx = this.context;
    const queryEntries = [...ctx.query.entries()];

    return html`
      <div class="card">
        <h2>Params / Query / Hash Viewer</h2>
        <p class="desc">
          <code>/params/:id?</code> — optional param, query string, hash 파싱을 확인합니다.
        </p>

        <div class="controls">
          <u-link href='/params'>No Param</u-link>
          <u-link href='/params/hello'>With Param</u-link>
          <u-link href='/params/world?page=1&size=20'>With Query</u-link>
          <u-link href='/params/test?q=search#section2'>Full Example</u-link>
          <u-link @click=${this.randomize}>Random</u-link>
        </div>

        <div class="grid">
          <div class="section">
            <div class="label">pathname</div>
            <div class="value">${ctx.pathname}</div>
          </div>
          <div class="section">
            <div class="label">params.id (optional)</div>
            <div class="value ${ctx.params['id'] ? '' : 'empty'}">
              ${ctx.params['id'] ?? '(없음)'}
            </div>
          </div>
          <div class="section">
            <div class="label">query (${queryEntries.length}개)</div>
            <div class="value">
              ${queryEntries.length === 0
                ? html`<span class="empty">(없음)</span>`
                : queryEntries.map(([k, v]) => html`<span class="tag">${k}=${v}</span>`)}
            </div>
          </div>
          <div class="section">
            <div class="label">hash</div>
            <div class="value ${ctx.hash ? '' : 'empty'}">
              ${ctx.hash ?? '(없음)'}
            </div>
          </div>
          <div class="section full">
            <div class="label">full context</div>
            <pre class="code">${this.serialize()}</pre>
          </div>
        </div>
      </div>
    `;
  }

  private randomize() {
    const ids = ['alpha', 'beta', 'gamma', 'delta'];
    const id = ids[Math.floor(Math.random() * ids.length)];
    const hashes = ['intro', 'section1', 'section2', 'footer'];
    const hash = hashes[Math.floor(Math.random() * hashes.length)];
    const page = Math.ceil(Math.random() * 10);
    (window as any).router.go(`/params/${id}?page=${page}&size=20#${hash}`);
  }

  private serialize() {
    if (!this.context) return '{}';
    const { href, origin, basepath, path, pathname, params, hash, metadata } = this.context;
    return JSON.stringify({
      href, origin, basepath, path, pathname, params,
      query: Object.fromEntries(this.context.query.entries()),
      hash,
      metadata,
    }, null, 2);
  }

  static styles = css`
    :host { display: block; }
    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    h2 { margin: 0 0 0.4rem; color: #111; }
    .desc { color: #6b7280; font-size: 0.85rem; margin: 0 0 1.25rem; }
    code { background: #f3f4f6; padding: 1px 5px; border-radius: 3px; }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }
    u-link {
      padding: 0.4rem 0.9rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 0.82rem;
      transition: all 0.15s;
    }
    u-link:hover { background: #f9fafb; border-color: #6366f1; color: #6366f1; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .full { grid-column: 1 / -1; }
    .section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 0.75rem;
    }
    .label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #6b7280; margin-bottom: 0.4rem; }
    .value { font-family: monospace; font-size: 0.9rem; color: #111; }
    .empty { color: #9ca3af; font-style: italic; }
    .tag {
      display: inline-block;
      background: #dbeafe;
      color: #1d4ed8;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.8rem;
      margin: 2px;
    }
    .code {
      margin: 0;
      font-size: 0.75rem;
      white-space: pre-wrap;
      word-break: break-all;
      color: #374151;
    }
  `;
}

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('async-page')
export class AsyncPage extends LitElement {
  @state() private _loadTime = performance.now();

  render() {
    const elapsed = (performance.now() - this._loadTime + 1100).toFixed(0);

    return html`
      <div class="card">
        <div class="icon">⏱️</div>
        <h2>Async Loading Demo</h2>
        <p class="desc">
          <code>render()</code>가 async 함수이며, 내부에서 <code>ctx.progress(n)</code>를 호출해
          진행 이벤트를 발생시킵니다. 좌측 상단의 진행바에서 확인할 수 있습니다.
        </p>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">총 소요 시간 (추정)</div>
            <div class="info-value">~${elapsed}ms</div>
          </div>
          <div class="info-item">
            <div class="info-label">Progress 단계</div>
            <div class="info-value">10% → 35% → 65% → 90% → 100%</div>
          </div>
        </div>

        <div class="code-block">
          <div class="code-title">render 함수 예시</div>
          <pre><code>render: async (ctx) => {
  ctx.progress(10);
  await fetch('/api/data');   // 실제 작업
  ctx.progress(65);
  await fetch('/api/more');
  ctx.progress(100);
  return html\`&lt;my-page&gt;&lt;/my-page&gt;\`;
}</code></pre>
        </div>

        <u-link href="/async">다시 로드</u-link>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; }
    .card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    h2 { margin: 0 0 0.5rem; color: #111; }
    .desc { color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem; }
    code { background: #f3f4f6; padding: 1px 4px; border-radius: 3px; font-size: 0.85em; }
    .info-grid { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .info-item {
      flex: 1;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 0.75rem 1rem;
    }
    .info-label { font-size: 0.75rem; font-weight: 700; color: #15803d; text-transform: uppercase; margin-bottom: 0.25rem; }
    .info-value { font-family: monospace; font-size: 0.9rem; color: #166534; }
    .code-block { margin-bottom: 1.5rem; }
    .code-title { font-size: 0.75rem; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 0.4rem; }
    pre {
      margin: 0;
      background: #1e1e2e;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
      color: #cdd6f4;
      font-size: 0.82rem;
      line-height: 1.6;
    }
    u-link {
      padding: 0.5rem 1.5rem;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    u-link:hover { background: #059669; }
  `;
}

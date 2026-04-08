import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('home-page')
export class HomePage extends LitElement {
  render() {
    return html`
      <div class="card">
        <h1>Router Test App</h1>
        <p class="desc">라우터의 다양한 기능을 테스트하는 샘플 앱입니다.</p>

        <div class="grid">
          <div class="item">
            <div class="item-title">🔒 Global Enter</div>
            <p>로그인하지 않으면 인증 필요 경로는 <code>/login</code>으로 redirect됩니다.</p>
          </div>
          <div class="item">
            <div class="item-title">🛡️ Per-Route Enter</div>
            <p><code>/admin</code>은 role=admin 일 때만 접근 가능. 아니면 <code>/forbidden</code>으로 redirect됩니다.</p>
          </div>
          <div class="item">
            <div class="item-title">🔤 Params / Query / Hash</div>
            <p><code>/params/:id?</code>로 optional param, query string, hash 파싱을 확인합니다.</p>
          </div>
          <div class="item">
            <div class="item-title">⏳ Async + Progress</div>
            <p><code>/async</code>에서 <code>ctx.progress()</code>로 진행 이벤트를 발생시키는 비동기 렌더링을 확인합니다.</p>
          </div>
          <div class="item">
            <div class="item-title">🪆 Nested Outlet (2-level)</div>
            <p><code>/nested</code>에서 부모 레이아웃 + 자식 <code>&lt;u-outlet&gt;</code> 구조를 확인합니다.</p>
          </div>
          <div class="item">
            <div class="item-title">🪆 Deep Nested (3-level)</div>
            <p><code>/nested/deep/:id</code>에서 3단계 중첩 라우팅을 확인합니다.</p>
          </div>
          <div class="item">
            <div class="item-title">⚛️ React Component</div>
            <p><code>/nested/react</code>에서 Lit 레이아웃 안에 React 컴포넌트를 렌더링합니다.</p>
          </div>
          <div class="item">
            <div class="item-title">💥 Error Handling</div>
            <p><code>/error</code>에서 render 중 throw 시 fallback으로 전환되는 것을 확인합니다.</p>
          </div>
          <div class="item">
            <div class="item-title">🔍 Metadata</div>
            <p>우측 사이드바에서 현재 라우트에 설정된 metadata를 확인합니다.</p>
          </div>
        </div>
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
    h1 { margin: 0 0 0.5rem; color: #111; font-size: 1.6rem; }
    .desc { color: #6b7280; margin: 0 0 1.5rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }
    .item {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .item-title {
      font-weight: 700;
      margin-bottom: 0.4rem;
      color: #111;
    }
    p { margin: 0; color: #6b7280; font-size: 0.85rem; line-height: 1.5; }
    code {
      font-size: 0.8rem;
      background: #e5e7eb;
      padding: 1px 4px;
      border-radius: 3px;
      color: #374151;
    }
  `;
}

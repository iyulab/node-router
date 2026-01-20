import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('home-page')
export class HomePage extends LitElement {
  render() {
    return html`
      <h1>🏠 Home Page</h1>
      <p>Router 테스트 페이지에 오신 것을 환영합니다!</p>
      
      <div class="features">
        <div class="feature">
          <h3>✨ Features</h3>
          <p>클라이언트 사이드 라우팅</p>
        </div>
        <div class="feature">
          <h3>🎯 Navigation</h3>
          <p>상단 메뉴로 이동 가능</p>
        </div>
        <div class="feature">
          <h3>📊 Events</h3>
          <p>라우팅 이벤트 실시간 확인</p>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-top: 1rem;
    }

    h1 {
      color: #333;
      margin-bottom: 1rem;
    }

    p {
      color: #666;
      line-height: 1.6;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }

    .feature {
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 4px;
    }

    .feature h3 {
      margin-bottom: 0.5rem;
      color: #007bff;
    }
  `;
}

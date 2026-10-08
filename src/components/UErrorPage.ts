import { RouteError } from '../types/RouteError.js';

const STYLES = `
    :host {
      --error-icon-color: #4a5568;
      --error-code-color: #1a202c;
      --error-message-color: #718096;
    }
    :host-context([theme="dark"]) {
      --error-icon-color: #a0aec0;
      --error-code-color: #f7fafc;
      --error-message-color: #cbd5e0;
    }

    @media (prefers-color-scheme: dark) {
      :host {
        --error-icon-color: #a0aec0;
        --error-code-color: #f7fafc;
        --error-message-color: #cbd5e0;
      }
    }

    /* The host display below outranks the browser's [hidden] rule. */
    :host([hidden]) {
      display: none !important;
    }

    :host {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: auto;
      user-select: none;
    }

    .icon {
      color: var(--error-icon-color);
      font-size: 6rem;
      opacity: 0.85;
    }

    .code {
      color: var(--error-code-color);
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 1rem 0;
    }

    .message {
      color: var(--error-message-color);
      font-size: 1rem;
      line-height: 1.6;
      max-width: 600px;
    }
  `;

/**
 * 라우팅 중 발생한 에러 정보를 사용자에게 전달하기 위한 기본 컴포넌트 입니다.
 *
 * `Router`가 `fallback`을 지정하지 않았을 때 내부적으로 그리는 기본 화면이라
 * `src/index.ts`에서 공개 export되지 않는다 — 직접 import해 쓰는 컴포넌트가
 * 아니다. 다만 라우팅 실패 시 실제 DOM에 렌더되므로, 기본 화면의 색만 가볍게
 * 맞추고 싶은 소비자를 위해 세 색상 훅을 남겨 둔다(전체 교체는 `fallback.render`).
 *
 * @cssprop --error-icon-color - 아이콘 색. 기본값 `#4a5568`(다크 `#a0aec0`)
 * @cssprop --error-code-color - 에러 코드 텍스트 색. 기본값 `#1a202c`(다크 `#f7fafc`)
 * @cssprop --error-message-color - 에러 메시지 텍스트 색. 기본값 `#718096`(다크 `#cbd5e0`)
 *
 * ⚠세 값은 위 `STYLES` 의 `:host` 에서 **구체적인 색으로 선언된다** — 지정하지
 * 않으면 주변 색을 상속하는 것이 아니라 위 기본값이 적용된다. 리터럴이므로 이 페이지는
 * 호스트 앱의 디자인 토큰을 따르지 않는다.
 */
export class UErrorPage extends HTMLElement {
  private _error?: RouteError;
  private readonly icon: HTMLDivElement;
  private readonly code: HTMLDivElement;
  private readonly message: HTMLDivElement;

  constructor(error?: RouteError) {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLES;
    const div = (cls: string) => Object.assign(document.createElement('div'), { className: cls });
    this.icon = div('icon');
    this.code = div('code');
    this.message = div('message');
    root.append(style, this.icon, this.code, this.message);
    this.error = error;
  }

  /** 표시할 에러 정보 */
  get error(): RouteError | undefined {
    return this._error;
  }
  set error(value: RouteError | undefined) {
    this._error = value;
    const error = value || this.getDefaultError();
    // 글자로만 넣는다 — 메시지는 라우트 경로 등 외부 값을 담을 수 있다.
    this.icon.textContent = this.getErrorIcon(error.code);
    this.code.textContent = String(error.code);
    this.message.textContent = error.message;
  }

  /** 기본 에러 정보 반환 */
  private getDefaultError(): RouteError {
    return new RouteError(500, 'Something went wrong. Please try again or contact support if the problem persists.');
  }

  /** 에러 코드에 따른 기본 아이콘 반환 */
  private getErrorIcon(code: number | string) {
    // 문자열 에러 코드 처리
    switch (String(code)) {
      case 'OUTLET_MISSING':
        return '📦';
      case 'CONTENT_LOAD_FAILED':
        return '📡';
      case 'CONTENT_RENDER_FAILED':
        return '🎨';
      case 'ACCESS_DENIED':
        return '🚫';
    }
    
    // 숫자 에러 코드 처리
    switch (typeof code === 'string' ? parseInt(code) : code) {
      case 404:
        return '🔍';
      case 403:
        return '🚫';
      case 401:
        return '🔐';
      case 429:
        return '⏱️';
      case 503:
        return '🛠️';
      default:
        return '⚠️';
    }
  }
}

customElements.define('u-error-page', UErrorPage);

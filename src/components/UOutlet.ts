import { render } from 'lit';

/** 렌더링 옵션 */
interface RenderOption {
  /** 교차 렌더링 방지 ID — 어느 라우트의 콘텐츠인가 */
  id?: string;
  /**
   * 라우트의 식별 키(`RouteConfig.key` 의 결과). 같은 라우트 + 같은 키면 기존 콘텐츠를
   * 유지한 채 제자리 갱신하고, 바뀌면 내리고 새로 마운트한다.
   */
  key?: string;
}

/** 지금 이 아웃렛에 마운트된 콘텐츠의 종류 — 제자리 갱신은 같은 종류끼리만 가능하다. */
type ContentKind = 'element' | 'lit' | 'react';

/**
 * LitElement 또는 React 컴포넌트를 렌더링해주는 웹컴포넌트 입니다.
 */
class UOutlet extends HTMLElement {
  /** 교차 렌더링 방지 id */
  private routeId?: string;
  /** 마지막으로 렌더한 라우트의 식별 키 */
  private routeKey?: string;
  /** 마운트된 콘텐츠의 종류 */
  private kind?: ContentKind;
  /** 실제 렌더링 컨텐츠 */
  private root?: any;
  /** 진행 중인 render — 다음 render 는 이것이 끝난 뒤 판정한다 */
  private pending?: Promise<void>;

  /**
   * 주어진 렌더링 옵션에 따라 컨텐츠를 렌더링합니다.
   *
   * 같은 라우트(`id`)에 같은 키(`key`)로 다시 불리면 **제자리 갱신**한다 — Lit 템플릿은
   * 같은 파트에 다시 렌더(요소·상태 유지, 바인딩만 갱신), React 엘리먼트는 같은 root 에 다시
   * 렌더(컴포넌트 상태 유지), `HTMLElement` 는 기존 인스턴스를 그대로 둔다. 매번 `reset()`
   * 을 먼저 부르던 종전 동작이 «쿼리스트링만 바뀌어도 페이지가 재마운트되는» 원인이었다
   * (Lit 의 `render` 도 React 의 `root.render` 도 같은 컨테이너에 다시 부르면 조정한다).
   */
  public async render(value: unknown, options?: RenderOption) {
    // 직렬화 — React 마운트는 동적 import 를 기다리는 동안 열려 있어, 그 사이 같은 라우트의
    // 두 번째 render 가 오면(초기 로드와 첫 go() 가 겹치는 형태) «root 없는 제자리 갱신» 이 된다.
    // 앞선 render 가 끝난 뒤에 판정해야 in-place 여부가 실제 마운트 상태를 본다.
    const prev = this.pending;
    const run = (async () => {
      if (prev) await prev.catch(() => undefined);
      await this.mount(value, options);
    })();
    this.pending = run;
    try {
      await run;
    } finally {
      if (this.pending === run) this.pending = undefined;
    }
  }

  private async mount(value: unknown, options?: RenderOption) {
    if (value === null) {
      throw new Error('Content is null and cannot be rendered.');
    }
    if (typeof value !== 'object') {
      throw new Error('Content is not a valid renderable object.');
    }

    const kind = contentKind(value);
    const inPlace =
      this.kind !== undefined &&
      this.kind === kind &&
      this.routeId === options?.id &&
      this.routeKey === options?.key;

    this.routeId = options?.id;
    this.routeKey = options?.key;

    if (inPlace) {
      if (kind === 'lit') {
        this.root = render(value, this);
      } else if (kind === 'react') {
        this.root.render(value);
      }
      // 'element': 조정할 수단이 없으므로 기존 인스턴스를 유지한다 — 새 ctx 는 창의
      // RouteDoneEvent 로만 도달한다(RouteConfig.key 참조).
      return;
    }

    this.reset();
    this.kind = kind;

    if (kind === 'element') {
      this.replaceChildren(value as HTMLElement);
      this.root = undefined;
    } else if (kind === 'lit') {
      this.root = render(value, this);
    } else {
      const { createRoot } = await import('react-dom/client');
      this.root = createRoot(this);
      this.root.render(value);
    }
  }

  /**
   * 기존 DOM을 삭제하여, 초기 상태로 되돌립니다.
   */
  public reset() {
    // Lit-Element가 붙어있던 경우 강제 초기화
    if (this.root && '_$litPart$' in this) {
      delete this._$litPart$;
    }

    // React가 붙어있던 경우
    if (this.root && 'unmount' in this.root) {
      this.root.unmount();
    }

    // Dom 초기화
    this.root = undefined;
    this.kind = undefined;
    this.innerHTML = "";
  }
}

/** 렌더 가능한 세 종류 중 무엇인가 — 아니면 서술적으로 던진다. */
function contentKind(value: object): ContentKind {
  if (value instanceof HTMLElement) return 'element';
  if ('_$litType$' in value) return 'lit';
  if ('$$typeof' in value) return 'react';
  const receivedType = value?.constructor?.name ?? typeof value;
  throw new Error(
    `Unsupported content type for Outlet rendering: received ${receivedType}. ` +
      `Expected an HTMLElement, a Lit TemplateResult, or a React element.`,
  );
}

customElements.define('u-outlet', UOutlet);

declare global {
  interface HTMLElementTagNameMap {
    'u-outlet': UOutlet;
  }
}

export { UOutlet };

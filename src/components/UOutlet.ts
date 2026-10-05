
/**
 * `<u-outlet>` 의 기본 표시 방식 — **상자를 만들지 않는다**(`display: contents`, 0.16.0).
 *
 * 아웃렛은 마운트 지점이다. 라우트 화면은 아웃렛을 담은 요소의 «직계 자식처럼» 배치된다.
 * ★`:where(u-outlet)` 로 특이도를 0 으로 둔다 — 소비자의 `u-outlet { … }` 규칙이 시트 순서와
 *   무관하게 `!important` 없이 이긴다(상자가 필요하면 `u-outlet { display: block }` 한 줄).
 * ⚠constructable 시트(`adoptedStyleSheets`)를 쓴다 — `<style>` 요소와 달리 CSP 의 인라인
 *   스타일 제한에 걸리지 않는다. 지원하지 않는 환경에서는 `<style>` 로 대신한다.
 *
 * ## 왜 상자가 없어야 하는가 — 세 형태의 화면이 한 상자로는 동시에 안 된다
 *
 * 높이가 정해진 스크롤 컨테이너(앱 셸의 본문) 안에서 라우트 화면은 세 형태다:
 *   ⑴채움 — `height: 100%` 로 부모 높이를 받는다
 *   ⑵채움-큼 — 채우되, 안의 표(`flex: 1; min-height: 0`)가 뷰포트보다 많은 행을 «자기 안에서» 굴린다
 *   ⑶흐름 — 부모보다 길어지고 컨테이너가 스크롤한다(끝 패딩이 스크롤 끝에 남아야 한다)
 *
 * 사이에 상자가 있으면 셋 중 하나가 반드시 깨진다(chromium 실측, 셸 본문 `padding: 32px`):
 *
 * | 아웃렛                            | ⑴ 채움    | ⑵ 채움-큼(표 50행)      | ⑶ 흐름: 끝 거터 |
 * |-----------------------------------|:---------:|:-----------------------:|:---------------:|
 * | `block; height:100%`(0.14.x)      |    ✓      |           ✓             | 🔴 사라짐       |
 * | `grid; min-height:100%`(0.15.x)   |    ✓      | 🔴 표가 전체 행 높이로  |       ✓         |
 * | `block`/`flex; min-height:100%`   | 🔴 무너짐 |           🔴            |       ✓         |
 * | **`contents`**                    |  **✓**    |         **✓**           |     **✓**       |
 *
 * - `height: 100%` 는 아웃렛을 부모 높이에 못 박는다 — ⑶의 화면이 그 밖으로 넘치고, 스크롤
 *   컨테이너는 끝 패딩을 in-flow 자식(= 못 박힌 아웃렛) 뒤에 붙이므로 스크롤 끝의 거터가 빠진다.
 * - grid 는 ⑶을 위해 자라지만, 트랙은 항목의 내용 크기로 잡히고 그 계산 동안 항목의
 *   `height: 100%` 는 `auto` 로 취급된다 — ⑵의 화면이 표의 모든 행만큼 트랙을 늘린다.
 * - `min-height` 는 자손의 백분율 높이가 풀릴 «정해진 높이» 가 아니다(CSS2.1 §10.5).
 * ⇒ ⑴·⑵는 «정해진 부모 높이» 를, ⑶은 «내용 높이» 를 요구한다. 한 상자는 둘 중 하나밖에 될 수
 *   없고, 상자가 없으면 화면이 부모(정해진 높이의 스크롤 컨테이너)를 직접 받는다.
 *
 * ⚠**대가** — 아웃렛에 거는 `padding`·`background`·`border` 는 아무 일도 하지 않고
 *   `getBoundingClientRect()` 는 0 을 돌려준다. 0.14.0 에서 이 대가를 이유로 `contents` 를
 *   기각했지만, 그 대가는 «문서화하고 한 줄로 되돌릴 수 있는» 것이고 반대편은 LOB 조회 화면의
 *   기본형(⑵)이 깨지는 것이었다.
 * ✅**인쇄** — 끝 블록의 아래 여백을 가둘 상자가 없으므로 여백이 문서 끝으로 접히고, 쪽 경계에
 *   닿은 여백은 조각화에서 잘린다(빈 꼬리 쪽이 생기지 않는다). 0.15.1 의 인쇄 전용 규칙이 필요 없다.
 * ✅**가로** — 격자 항목의 `min-width: auto` 가 넓은 표 폭을 끌어올리던 문제(0.15.2)도 상자와 함께 사라진다.
 */
const OUTLET_DISPLAY_CSS = ':where(u-outlet) { display: contents; }';

/** 시트를 이미 채택한 트리 — 같은 트리에 두 번 넣지 않는다. */
const styledRoots = new WeakSet<Document | ShadowRoot>();

/**
 * 아웃렛이 실제로 속한 트리에 표시 규칙을 채택한다.
 *
 * ⚠`document` 로 못박지 않는다 — 섀도 루트 안의 `<u-outlet>` 은 문서 시트가 닿지 않아
 *   기본 `inline` 그대로 남는다. 아웃렛을 라이트 DOM 에 두는 것이 이 생태계의 관례이지만,
 *   그 관례를 어긴 배치에서 조용히 규칙이 사라지는 쪽이 더 나쁘다.
 */
function adoptOutletDisplay(node: Node): void {
  // ⚠`instanceof Document` 로 재지 않는다 — 프로토타입 사슬이 realm 마다 갈려(iframe 문서,
  //   그리고 실측상 happy-dom 의 `HTMLDocument`) 정당한 트리가 «조용히» 대상에서 빠진다.
  //   노드 종류는 그 경계를 넘어 같은 값을 갖는다.
  const isDocument = node.nodeType === 9; // Node.DOCUMENT_NODE
  const isShadowRoot = node.nodeType === 11 && 'host' in node; // DocumentFragment + host
  if (!isDocument && !isShadowRoot) return;

  const root = node as Document | ShadowRoot;
  if (styledRoots.has(root)) return;
  styledRoots.add(root);

  if ('adoptedStyleSheets' in root && typeof CSSStyleSheet !== 'undefined'
    && typeof CSSStyleSheet.prototype.replaceSync === 'function') {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(OUTLET_DISPLAY_CSS);
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    return;
  }

  const ownerDocument = isDocument ? (root as Document) : node.ownerDocument;
  if (!ownerDocument) return;
  const style = ownerDocument.createElement('style');
  style.textContent = OUTLET_DISPLAY_CSS;
  const target = isDocument ? (root as Document).head : root;
  target?.prepend(style);
}

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

  connectedCallback() {
    adoptOutletDisplay(this.getRootNode());
  }

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
        this.root = (await loadLit()).render(value, this);
        await this.childrenRendered();
      } else if (kind === 'react') {
        await commitReact(this.root, value);
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
      this.root = (await loadLit()).render(value, this);
      await this.childrenRendered();
    } else {
      const { createRoot } = await import('react-dom/client');
      this.root = createRoot(this);
      await commitReact(this.root, value);
    }
  }

  /**
   * 방금 그린 최상위 요소들의 첫 렌더를 기다린다 — `render()` 가 끝났다는 것은 «내용이 그려졌다» 여야
   * `route-done` 을 듣는 쪽(포커스 배치 등)이 화면을 읽을 수 있다. Lit 요소는 연결된 뒤 자기 템플릿을 비동기로 그린다.
   */
  private async childrenRendered(): Promise<void> {
    await Promise.all(
      Array.from(this.children, (el) => (el as { updateComplete?: Promise<unknown> }).updateComplete),
    );
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

/**
 * React 트리를 커밋까지 렌더한다. `root.render()` 는 커밋을 «예약» 만 하므로, 그대로 두면 `route-done` 이
 * 빈 컨테이너를 보고 난다. `flushSync` 가 그 자리에서 커밋한다.
 */
/**
 * Lit 은 라우트가 Lit 템플릿을 돌려줄 때만 싣는다 — 템플릿을 만든 앱은 이미 Lit 을 갖고 있고(선택적 peer), React·요소만
 * 쓰는 앱은 Lit 없이 라우터를 쓴다. `react-dom/client` 와 같은 지연 로드다.
 */
function loadLit(): Promise<typeof import('lit')> {
  return import('lit');
}

async function commitReact(root: { render(value: unknown): void }, value: unknown): Promise<void> {
  const { flushSync } = await import('react-dom');
  flushSync(() => root.render(value));
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

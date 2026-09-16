import { render } from 'lit';

/**
 * `<u-outlet>` 의 기본 표시 방식.
 *
 * ★커스텀 엘리먼트의 UA 기본값은 `inline` 이다 — 라우트 화면(블록 요소들)을 인라인 상자에
 *   담으면 block-in-inline 분할이 생겨, 인쇄에서 짧은 문서에 빈 꼬리 쪽이 붙는다. 컨테이너
 *   요소의 표시 방식은 그것을 정의한 쪽이 선언해야 하고, 그 쪽은 이 패키지다.
 * ★`:where(u-outlet)` 로 특이도를 0 으로 둔다 — 소비자의 `u-outlet { … }` 규칙이 시트 순서와
 *   무관하게 `!important` 없이 이긴다.
 * ⚠constructable 시트(`adoptedStyleSheets`)를 쓴다 — `<style>` 요소와 달리 CSP 의 인라인
 *   스타일 제한에 걸리지 않는다. 지원하지 않는 환경에서는 `<style>` 로 대신한다.
 * ⚠매체를 가르지 않는다 — 인라인 컨테이너는 화면에서도 의도된 적이 없다(라인 박스 때문에
 *   높이를 줄 수도, 백분율로 채울 수도 없었다). 인쇄에만 한정하면 화면·인쇄가 서로 다른
 *   상자 모델을 갖게 되어 같은 부류의 차이가 다음에 또 난다.
 *
 * ## 왜 `grid` + `min-height` 인가 — 두 요구가 한 선언으로는 안 된다
 *
 * 아웃렛은 **동시에 두 가지**여야 한다:
 *   ⑴부모가 높이를 가지면 **그 높이를 자손에게 물려준다**(자손의 `height:100%` 가 여기서 풀린다)
 *   ⑵화면이 부모보다 크면 **자기도 함께 자란다**(넘침이 아웃렛 «밖» 으로 새지 않는다)
 *
 * 🔴`height: 100%` 는 ⑴만 준다. 0.14.0 이 그 판이었다 — 콘텐츠 영역이 고정 높이일 때
 *   아웃렛이 그 높이로 **못 박히고**
 *   화면이 밖으로 넘쳐, 스크롤 컨테이너의 끝 패딩이 스크롤 영역에서 빠진다 — 긴 화면을 끝까지
 *   내리면 **내용이 바닥에 붙는다**(거터가 위·좌·우에만 남는다).
 * 🔴`min-height: 100%` 만으로는 ⑴이 깨진다. 백분율 높이는 부모의 **`height`** 가 명시됐을 때만
 *   풀리고 `min-height` 는 그 조건을 만족시키지 않는다(CSS2.1 §10.5) — 그래서 `block` 이든
 *   `flex` 든 `min-height` 로 바꾸면 자손의 `height:100%` 가 `auto` 로 풀려 화면이 무너진다.
 * ✅`grid` 만 둘을 함께 준다. 그리드 항목의 기본 `align-self: stretch` 가 «백분율을 푸는 것» 이
 *   아니라 **영역을 채우는 것**이라, 컨테이너 높이가 부정(indefinite)이어도 ⑴이 성립한다.
 *   그리고 컨테이너 높이가 `auto` 라 내용이 크면 ⑵대로 자란다.
 *
 * 실측(chromium · 셸 본문 720px `padding:32px` `overflow:auto` / 화면 1588px):
 *
 * | 규칙                             | 전체높이: 표 | 넘침: `scrollHeight` | 아웃렛 박스 |
 * |----------------------------------|-------------:|---------------------:|------------:|
 * | `inline`(0.13.0 이전)            |          616 |                    — |           — |
 * | `block; height:100%`(0.14.0)     |          616 |            🔴 1620   |  656(고정)  |
 * | `contents`                       |          616 |                 1652 |  0(박스 없음)|
 * | **`grid; min-height:100%`**      |      **616** |             **1652** | **1588**    |
 * | `flex column; min-height:100%`   |        🔴 0  |                 1652 |        1588 |
 * | `block; min-height:100%`         |        🔴 0  |                 1652 |        1588 |
 *
 * ⚠**`contents` 를 택하지 않은 이유는 수치가 아니라 박스다** — 박스가 사라지면 소비자의
 *   `u-outlet { padding }`·`{ background }` 와 `getBoundingClientRect()` 가 **오류 없이 아무 일도
 *   안 하게** 된다. 아웃렛이 높이를 끊는 증상 자체가 「내 CSS 가 안 먹는다」로 나타나므로,
 *   그 부류를 새로 만들지 않는다. grid 는 `contents` 의 두 수치를 내면서 박스를 남긴다.
 * ⚠**`align-content` 를 선언하지 말 것** — `start` 를 주면 트랙이 늘어나지 않아 ⑴이 조용히
 *   깨진다(실측: 자손 400px → 0px). 기본값 `normal` 이어야 한다.
 * ⚠**자식이 둘 이상이어도 block 과 같다**(실측: 20px·30px 자식이 각각 20·30 그대로) — 트랙은
 *   늘어나지만 높이가 정해진 항목은 `stretch` 대상이 아니다.
 * ⚠**부모 높이가 `auto` 면 `min-height:100%` 도 `auto` 로 풀린다** — 일반 문서 흐름과 인쇄를
 *   가두지 않는다.
 * 🔴**소비자가 아웃렛을 «줄이려면» `height` 만으로는 부족하고 `min-height: 0` 이 함께 필요하다**
 *   — 0.14.0 대비 유일한 계약 추가이며 README·CHANGELOG·참조 문서에 적혀 있다.
 */
const OUTLET_DISPLAY_CSS = ':where(u-outlet) { display: grid; min-height: 100%; }';

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

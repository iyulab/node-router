/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/components/UOutlet.js';
import '../../src/components/UErrorPage.js';

/**
 * **`<u-outlet>` 의 계약 일부는 «상자 모델» 이고, 그것은 계산된 레이아웃으로만 갈린다.**
 *
 * 유닛 스위트(`tests/outlet-display-block.test.ts`)는 happy-dom 에서 돌며 «규칙이 트리에
 * 실렸는가» 까지만 말할 수 있다 — happy-dom 은 레이아웃을 계산하지 않으므로 «그래서 어떻게
 * 배치되는가» 는 원리적으로 답하지 못한다.
 *
 * 🔴그 간극에서 실제로 회귀가 났다(cycle-628). 아웃렛에 `display: block` 을 선언하자
 * 유닛은 전건 통과했지만, **자손의 백분율 높이**가 무효가 되어 «화면을 채우는» 레이아웃이
 * 내용 높이로 무너졌다(747px → 60px). `display` 를 바꾸는 것은 상자 모델 전체를 바꾸는 것이고,
 * 그 파급은 자기 요소가 아니라 자손에서 난다 — 이 파일이 그 축을 잰다.
 */

const settle = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 40));
};

const h = (el: Element) => Math.round(el.getBoundingClientRect().height);

describe('u-outlet — 상자 모델 (실제 엔진)', () => {
  let parent: HTMLDivElement;
  let outlet: HTMLElement;

  beforeEach(async () => {
    parent = document.createElement('div');
    parent.style.cssText = 'width: 600px; height: 400px;';
    document.body.appendChild(parent);
    outlet = document.createElement('u-outlet');
    parent.appendChild(outlet);
    await settle();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('블록 상자다 — 커스텀 엘리먼트의 UA 기본값 `inline` 이 아니다', () => {
    expect(getComputedStyle(outlet).display).toBe('block');
  });

  it('🔴높이를 가진 부모를 채운다 — 자손의 `height:100%` 가 여기서 풀린다', () => {
    // 내용은 20px 뿐이다. 사슬이 끊기면(`height` 선언이 없으면) 여기서 20 이 나온다.
    const child = document.createElement('div');
    child.style.height = '20px';
    outlet.appendChild(child);
    expect(h(outlet)).toBe(400);
  });

  it('🔴자손의 백분율 높이가 실제로 풀린다', async () => {
    const child = document.createElement('div');
    child.style.height = '50%';
    outlet.appendChild(child);
    await settle();
    // 백분율이 무효가 되면 `auto` 로 풀려 0 이 된다(내용 없음).
    expect(h(child)).toBe(200);
  });

  it('부모 높이가 `auto` 면 아웃렛도 `auto` 다 — 일반 문서 흐름·인쇄를 가두지 않는다', async () => {
    parent.style.height = 'auto';
    const tall = document.createElement('div');
    tall.style.height = '1200px';
    outlet.appendChild(tall);
    await settle();
    expect(h(outlet)).toBe(1200);
    expect(outlet.scrollHeight).toBeLessThanOrEqual(outlet.clientHeight + 1);
  });

  it('소비자 규칙이 `!important` 없이 이긴다 — 두 선언 모두', async () => {
    const style = document.createElement('style');
    style.textContent = 'u-outlet { display: flex; height: auto; }';
    document.head.appendChild(style);
    try {
      const child = document.createElement('div');
      child.style.height = '20px';
      outlet.appendChild(child);
      await settle();
      expect(getComputedStyle(outlet).display).toBe('flex');
      expect(h(outlet)).toBe(20);
    } finally {
      style.remove();
    }
  });

  it('라우터 자신의 폴백 화면(`u-error-page`)이 아웃렛 안에서 부모를 채운다', async () => {
    // UErrorPage 는 `:host { height: 100% }` 다 — 라우터가 스스로 아웃렛에 렌더하므로,
    // 사슬이 끊기면 «라우터 자신의 오류 화면» 이 먼저 무너진다.
    const page = document.createElement('u-error-page');
    outlet.appendChild(page);
    await settle();
    expect(h(page)).toBe(400);
  });
});

/**
 * **부모가 flex·grid 여도 사슬이 이어진다** (cycle-631 · docket `#308`).
 *
 * 두 번째 독립 소비자(`#308`)가 같은 근본 원인을 보고하면서 `display: contents` 를 선호했고,
 * 그 근거로 *"부모가 flex/grid 일 때 `height: 100%` 가 기대대로 안 먹는 경우가 있어 A 보다
 * 취약하다"* 를 들었다. 실측하니 **세 부모 토폴로지 전부에서 이어진다** — 그 우려는 재현되지
 * 않았다. 이 스위트가 그 사실을 고정한다(주장이 아니라 측정으로 남긴다).
 *
 * ⚠**종전(`inline`)은 flex 부모에서 오히려 먼저 깨졌다** — 인라인은 flex 항목으로 blockify 되고
 *   높이는 `auto` 라 내용 높이로 무너진다. 즉 `#308` 의 소비앱은 0.13.0 에서 이미 막혀 있었다.
 */
describe('u-outlet — 부모 토폴로지별 높이 사슬 (docket #308)', () => {
  let parent: HTMLDivElement;
  let outlet: HTMLElement;
  let screen: HTMLDivElement;

  beforeEach(async () => {
    parent = document.createElement('div');
    parent.style.cssText = 'width: 600px; height: 400px;';
    document.body.appendChild(parent);
    outlet = document.createElement('u-outlet');
    screen = document.createElement('div');
    screen.style.height = '100%';
    outlet.appendChild(screen);
    parent.appendChild(outlet);
    await settle();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  for (const [name, css] of [
    ['block', 'display: block;'],
    ['flex', 'display: flex; flex-direction: column;'],
    ['grid', 'display: grid; grid-template-rows: 1fr;'],
  ] as const) {
    it(`부모가 ${name} 이어도 라우트 화면이 부모 높이를 받는다`, async () => {
      parent.setAttribute('style', `width: 600px; height: 400px; ${css}`);
      await settle();
      // 화면의 내용은 비어 있다 — 사슬이 끊기면 0 이 나온다.
      expect(h(screen)).toBe(400);
    });
  }
});

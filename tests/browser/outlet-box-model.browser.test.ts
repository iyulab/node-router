/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cdp } from 'vitest/browser';
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

  it('블록 레벨 상자다 — 커스텀 엘리먼트의 UA 기본값 `inline` 이 아니다', () => {
    // ⚠재는 것은 «grid 인가» 가 아니라 «inline 이 아닌가» 다 — 계약은 「라우트 화면을 담는
    //   블록 레벨 컨테이너」이고, 그것을 무엇으로 구현하는지는 이 파일이 고정할 축이 아니다.
    //   (cycle-645 에서 `block` → `grid` 로 바뀌었고, 이 단언은 그때 바뀌지 않아야 했다.)
    expect(getComputedStyle(outlet).display).not.toBe('inline');
    expect(getComputedStyle(outlet).display).toBe('grid');
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
    // 🔴0.15.0 의 유일한 계약 추가: 아웃렛을 «줄이려면» `min-height: 0` 이 함께 필요하다.
    //   종전(`height: 100%`)에는 `height` 하나로 충분했다 — `min-height` 는 바닥이라
    //   `height` 만 줄여도 바닥이 이긴다. 이 문장이 README·CHANGELOG·스킬에도 있다.
    const style = document.createElement('style');
    style.textContent = 'u-outlet { display: flex; min-height: 0; height: auto; }';
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

  it('🔴`min-height` 를 남긴 채 `height` 만 덮으면 바닥이 이긴다 — 계약 추가의 네거티브 면', async () => {
    // 이 단언이 실패한다면 규칙이 `height` 로 돌아갔다는 뜻이다(= 넘침 축 회귀).
    const style = document.createElement('style');
    style.textContent = 'u-outlet { height: 20px; }';
    document.head.appendChild(style);
    try {
      await settle();
      expect(h(outlet)).toBe(400);
    } finally {
      style.remove();
    }
  });

  it('자식이 둘 이상이어도 각자 자기 높이를 지킨다 — 그리드 트랙이 자식을 늘리지 않는다', async () => {
    // grid 컨테이너의 여유 공간은 트랙으로 가지만, 높이가 «정해진» 항목은 `stretch` 대상이
    // 아니다. 즉 이 축에서 block 과 같은 값이 나온다 — 규칙 교체가 다중 자식 렌더를 바꾸지
    // 않았다는 증거다(cycle-645 가 교체 전에 먼저 잰 축).
    const a = document.createElement('div');
    a.style.height = '20px';
    const b = document.createElement('div');
    b.style.height = '30px';
    outlet.append(a, b);
    await settle();
    expect([h(a), h(b)]).toEqual([20, 30]);
  });

  it('🔴`align-content` 를 선언하면 사슬이 끊긴다 — 규칙이 기본값 `normal` 에 기대고 있다', async () => {
    // 네거티브 컨트롤을 회귀로 굳힌 것이다: 이 규칙에 `align-content: start` 를 «개선» 이라
    // 생각해 더하면 자손의 채우기가 조용히 0 이 된다. 그 실패를 여기서 소리 나게 만든다.
    const style = document.createElement('style');
    style.textContent = 'u-outlet { align-content: start; }';
    document.head.appendChild(style);
    try {
      const child = document.createElement('div');
      child.style.height = '100%';
      outlet.appendChild(child);
      await settle();
      expect(h(child)).toBe(0);
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

/**
 * **높이가 정해진 부모 안에서 화면이 «넘칠» 때** (cycle-645 · docket `#308` 2차 실측).
 *
 * 🔴이 축이 `router@0.14.0` 을 게시할 때 **우리 회귀에 없었다.** 위 스위트는 「부모가 `auto` 면
 *   아웃렛도 `auto`」까지는 쟀지만 **「부모가 «정해진 높이» 이고 자식이 그보다 클 때」**를 재지
 *   않았고, 그 공백에서 결함이 게시됐다 — 소비자(`iyulab/EDMS-v2`)가 자기 앱에서 실측해
 *   돌려보내고서야 드러났다. ⇒ ***회귀는 «우리가 생각한 토폴로지» 만 덮는다.***
 *
 * 재현 형태는 실제 셸이다: 콘텐츠 영역이 **고정 높이 + `padding` + `overflow: auto`** 이고
 * 라우트 화면이 그보다 길다. 스크롤 컨테이너는 스크롤 영역에 끝 패딩을 더하는데, 그 대상은
 * **in-flow 자식**이지 그 자손의 넘침이 아니다. 아웃렛이 `height: 100%` 로 못 박히면 화면은
 * 아웃렛 «밖» 으로 넘치고, 끝 패딩이 스크롤 영역에서 빠져 **내용이 바닥에 붙는다.**
 *
 * 소비자 실측(1588px 화면): `height:100%` → `scrollHeight` **1620**(끝 여백 0) ·
 * `contents` → 1652(끝 여백 32). 아래가 그 수치를 우리 쪽에서 고정한다.
 */
describe('u-outlet — 넘치는 화면과 셸 거터 (docket #308 2차)', () => {
  const PAD = 32;
  const SHELL = 720;
  const SCREEN = 1588;
  let main: HTMLDivElement;
  let outlet: HTMLElement;

  beforeEach(async () => {
    main = document.createElement('div');
    main.style.cssText =
      `width: 600px; height: ${SHELL}px; padding: ${PAD}px; box-sizing: border-box; overflow: auto;`;
    document.body.appendChild(main);
    outlet = document.createElement('u-outlet');
    main.appendChild(outlet);
    const screen = document.createElement('div');
    screen.style.height = `${SCREEN}px`;
    outlet.appendChild(screen);
    await settle();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('🔴아웃렛이 넘치는 화면과 «함께 자란다» — 못 박히지 않는다', () => {
    // 네거티브 컨트롤: 규칙을 `height: 100%` 로 되돌리면 656(= 720 − 32×2)이 나온다.
    expect(h(outlet)).toBe(SCREEN);
  });

  it('🔴셸의 끝 거터가 스크롤 영역에 살아 있다 — 끝까지 내려도 바닥에 붙지 않는다', () => {
    // 1588 + 위 32 + 아래 32 = 1652. `height: 100%` 판에서는 1620 이었다(아래 32 가 빠진다).
    expect(main.scrollHeight).toBe(SCREEN + PAD * 2);
  });

  it('넘치지 않는 화면에서는 종전과 같다 — 아웃렛이 콘텐츠 영역을 정확히 채운다', async () => {
    (outlet.firstElementChild as HTMLElement).style.height = '100%';
    await settle();
    expect(h(outlet)).toBe(SHELL - PAD * 2);
    expect(main.scrollHeight).toBe(main.clientHeight);
  });
});

/**
 * **인쇄 매체에서는 아웃렛이 `block` 이다 — 끝 블록의 아래 여백이 아웃렛을 뚫고 접힌다**
 * (cycle-659 · docket `#302` 3차 실측).
 *
 * 🔴`0.15.0` 의 `grid` 는 **자기 안에서 여백 접힘을 막는다.** 라우트 화면의 마지막 블록이
 *   `margin-bottom` 을 가지면 그 여백이 아웃렛 높이 «안으로» 들어오고, 내용 끝이 쪽 경계에서
 *   그 여백 이내에 있으면 **빈 꼬리 쪽**이 생긴다. `block` 에서는 여백이 문서 끝까지 접혀 나가고
 *   쪽 경계에 닿은 여백은 조각화에서 잘린다(CSS Fragmentation §5.2) — 그래서 1쪽이다.
 *   소비자 실측(긴 청구서, 끝 블록 `margin-bottom: 24px`): `block` 1105.5px·1쪽 ↔
 *   `grid` **1129.5px·2쪽**, 그 여백만 0 으로 하면 grid 도 1쪽.
 *
 * ⚠인쇄에서 `grid` 가 줄 수 있던 것은 «정해진 부모 높이를 자손에게» 뿐인데, 셸은 뷰포트 높이를
 *   `@media screen` 안에서만 건다 — 인쇄에서 부모 높이는 `auto` 이고 그 이득은 없다.
 *   이 스위트는 그 셸 형태(화면에서만 고정 높이)를 그대로 세운다.
 *
 * ⚠우리 스위트가 **여섯 번** 이 증상을 재현하지 못한 이유가 정확히 이 조건이었다 — 재현
 *   픽스처의 끝 블록에 아래 여백이 없었다. ⇒ 쪽수가 아니라 **그 기전(여백이 상자 안에 갇히는가)**
 *   을 잰다. 쪽수는 내용 높이와 용지 크기에 따라 갈리지만 기전은 갈리지 않는다.
 */
describe('u-outlet — 인쇄 매체 상자 모델 (docket #302 3차)', () => {
  const CONTENT = 300;
  const MARGIN = 24;
  let shell: HTMLDivElement;
  let outlet: HTMLElement;
  let last: HTMLDivElement;
  let screenOnly: HTMLStyleElement;

  const setMedia = async (media: 'print' | '') => {
    await cdp().send('Emulation.setEmulatedMedia', { media });
    await settle();
  };

  beforeEach(async () => {
    // 실제 셸처럼 «화면에서만» 고정 높이를 준다.
    screenOnly = document.createElement('style');
    screenOnly.textContent = '@media screen { .print-shell { height: 700px; } }';
    document.head.appendChild(screenOnly);
    shell = document.createElement('div');
    shell.className = 'print-shell';
    shell.style.width = '600px';
    document.body.appendChild(shell);
    outlet = document.createElement('u-outlet');
    shell.appendChild(outlet);
    const route = document.createElement('div');
    last = document.createElement('div');
    last.style.cssText = `height: ${CONTENT}px; margin-bottom: ${MARGIN}px;`;
    route.appendChild(last);
    outlet.appendChild(route);
    await settle();
  });

  afterEach(async () => {
    await setMedia('');
    document.body.replaceChildren();
    screenOnly.remove();
  });

  it('인쇄 매체에서 블록 상자다', async () => {
    await setMedia('print');
    expect(getComputedStyle(outlet).display).toBe('block');
  });

  it('🔴인쇄 매체에서 끝 블록의 아래 여백이 아웃렛 «밖» 으로 접힌다 — 상자 높이에 들어오지 않는다', async () => {
    await setMedia('print');
    // 네거티브 컨트롤: 인쇄 규칙을 빼면(= grid 그대로) 324 가 나온다.
    expect(h(outlet)).toBe(CONTENT);
    expect(h(shell)).toBe(CONTENT);
  });

  it('인쇄 매체에서 `min-height:100%` 가 아웃렛을 셸 높이로 늘리지 않는다 — 셸 높이가 화면 전용이다', async () => {
    await setMedia('print');
    const extra = document.createElement('div');
    extra.style.height = '10px';
    outlet.firstElementChild!.prepend(extra);
    await settle();
    expect(h(outlet)).toBe(CONTENT + 10);
  });

  it('인쇄 매체에서도 소비자 규칙이 `!important` 없이 이긴다', async () => {
    const consumer = document.createElement('style');
    consumer.textContent = 'u-outlet { display: flex; }';
    document.head.appendChild(consumer);
    try {
      await setMedia('print');
      expect(getComputedStyle(outlet).display).toBe('flex');
    } finally {
      consumer.remove();
    }
  });

  it('화면 매체로 돌아오면 종전 모델이다 — grid 로 셸을 채우고 여백은 상자 안에 있다', async () => {
    await setMedia('print');
    await setMedia('');
    expect(getComputedStyle(outlet).display).toBe('grid');
    expect(h(outlet)).toBe(700);
  });
});

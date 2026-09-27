/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cdp } from 'vitest/browser';
import '../../src/components/UOutlet.js';
import '../../src/components/UErrorPage.js';

/**
 * **`<u-outlet>` 의 계약 일부는 «상자 모델» 이고, 그것은 계산된 레이아웃으로만 갈린다.**
 *
 * 유닛 스위트(`tests/outlet-display.test.ts`)는 happy-dom 에서 돌며 «규칙이 트리에 실렸는가»
 * 까지만 말할 수 있다. 이 파일이 «그래서 어떻게 배치되는가» 를 잰다.
 *
 * 🔴아웃렛은 이 축에서 세 번 바뀌었고 세 번 다 «우리가 생각한 화면» 만 쟀다가 소비자 실측으로
 * 뒤집혔다 — `block; height:100%`(흐름 화면의 끝 거터가 사라짐) → `grid; min-height:100%`
 * (행이 많은 채우는 화면에서 표가 전체 행 높이로 자람) → `contents`. 그래서 이 파일은 규칙이
 * 아니라 **화면의 세 형태**로 짜여 있다: 채움 · 채움-큼(표가 안에서 스크롤) · 흐름.
 */

const settle = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 40));
};

const h = (el: Element) => Math.round(el.getBoundingClientRect().height);
const w = (el: Element) => Math.round(el.getBoundingClientRect().width);

/** 화면의 세 형태. 채움-큼은 LOB 조회 화면의 기본형이다(툴바 + 남은 높이를 채우고 안에서 스크롤하는 표). */
function screenOf(kind: 'fill' | 'fillLarge' | 'flow', flowHeight = 1588): { screen: HTMLDivElement; table?: HTMLDivElement } {
  const screen = document.createElement('div');
  if (kind === 'flow') {
    // 높이 선언이 없는 흐름 화면 — 내용이 길이를 정한다.
    screen.innerHTML = `<div style="height:${flowHeight}px">form</div>`;
    return { screen };
  }
  screen.style.cssText = 'height: 100%; display: flex; flex-direction: column;';
  const toolbar = document.createElement('div');
  toolbar.style.height = '40px';
  const table = document.createElement('div');
  table.style.cssText = 'flex: 1; min-height: 0; overflow: auto;';
  const rows = kind === 'fillLarge' ? 50 : 1;
  table.innerHTML = Array.from({ length: rows }, (_, i) => `<div style="height:40px">row ${i}</div>`).join('');
  screen.append(toolbar, table);
  return { screen, table };
}

describe('u-outlet — 상자를 만들지 않는다', () => {
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

  it('display 는 contents 다 — UA 기본값 inline 이 아니다', () => {
    expect(getComputedStyle(outlet).display).toBe('contents');
  });

  for (const [name, css] of [
    ['block', 'display: block;'],
    ['flex', 'display: flex; flex-direction: column;'],
    ['grid', 'display: grid; grid-template-rows: 1fr;'],
  ] as const) {
    it(`부모가 ${name} 이어도 채우는 화면이 부모 높이를 받는다`, async () => {
      parent.setAttribute('style', `width: 600px; height: 400px; ${css}`);
      const screen = document.createElement('div');
      screen.style.height = '100%';
      outlet.appendChild(screen);
      await settle();
      expect(h(screen)).toBe(400);
    });
  }

  it('라우터 자신의 폴백 화면(u-error-page)이 부모를 채운다', async () => {
    const page = document.createElement('u-error-page');
    outlet.appendChild(page);
    await settle();
    expect(h(page)).toBe(400);
  });

  it('소비자 규칙이 !important 없이 이긴다 — 상자가 필요하면 한 줄로 되돌린다', async () => {
    const style = document.createElement('style');
    style.textContent = 'u-outlet { display: block; }';
    document.head.appendChild(style);
    try {
      await settle();
      expect(getComputedStyle(outlet).display).toBe('block');
    } finally {
      style.remove();
    }
  });
});

/**
 * **높이가 정해진 스크롤 컨테이너 안에서** — 실제 앱 셸의 본문과 같은 토폴로지
 * (고정 높이 · `padding` · `overflow: auto`).
 */
describe('u-outlet — 스크롤 컨테이너 안의 세 형태', () => {
  const PAD = 32;
  const SHELL = 720;
  const AVAIL = SHELL - PAD * 2;
  let main: HTMLDivElement;
  let outlet: HTMLElement;

  beforeEach(async () => {
    main = document.createElement('div');
    main.style.cssText =
      `width: 600px; height: ${SHELL}px; padding: ${PAD}px; box-sizing: border-box; overflow: auto;`;
    document.body.appendChild(main);
    outlet = document.createElement('u-outlet');
    main.appendChild(outlet);
    await settle();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('채움: 화면이 콘텐츠 영역을 정확히 채우고 스크롤이 생기지 않는다', async () => {
    const { screen } = screenOf('fill');
    outlet.appendChild(screen);
    await settle();
    expect(h(screen)).toBe(AVAIL);
    expect(main.scrollHeight).toBeLessThanOrEqual(main.clientHeight);
  });

  it('🔴채움-큼: 행이 많아도 화면은 콘텐츠 영역 높이이고 표가 자기 안에서 스크롤한다', async () => {
    const { screen, table } = screenOf('fillLarge');
    outlet.appendChild(screen);
    await settle();
    // 네거티브 컨트롤: 0.15.x 의 `grid; min-height:100%` 면 화면이 2040(= 툴바 + 50행)으로 자란다.
    expect(h(screen)).toBe(AVAIL);
    expect(h(table!)).toBe(AVAIL - 40);
    expect(table!.scrollHeight, '표 안에 굴릴 행이 있다').toBeGreaterThan(table!.clientHeight);
    expect(main.scrollHeight, '콘텐츠 영역은 스크롤하지 않는다').toBeLessThanOrEqual(main.clientHeight);
  });

  it('🔴흐름: 긴 화면에서 컨테이너가 스크롤하고 끝 거터가 스크롤 끝에 남는다', async () => {
    const { screen } = screenOf('flow', 1588);
    outlet.appendChild(screen);
    await settle();
    // 네거티브 컨트롤: 0.14.x 의 `block; height:100%` 면 1620(끝 거터 없음)이 나온다.
    expect(main.scrollHeight).toBe(PAD + 1588 + PAD);
    main.scrollTop = main.scrollHeight;
    await settle();
    const gap = main.getBoundingClientRect().bottom - screen.getBoundingClientRect().bottom;
    expect(Math.round(gap)).toBe(PAD);
  });

  it('흐름-짧음: 스크롤이 생기지 않는다', async () => {
    const { screen } = screenOf('flow', 100);
    outlet.appendChild(screen);
    await settle();
    expect(main.scrollHeight).toBeLessThanOrEqual(main.clientHeight);
  });

  it('NEGATIVE 0.15.x 규칙을 소비자가 되살리면 채움-큼이 다시 자란다 — 이 파일이 그 차이를 잰다는 증거', async () => {
    const style = document.createElement('style');
    style.textContent = 'u-outlet { display: grid; grid-template-columns: minmax(0, 1fr); min-height: 100%; }';
    document.head.appendChild(style);
    try {
      const { screen } = screenOf('fillLarge');
      outlet.appendChild(screen);
      await settle();
      expect(h(screen)).toBeGreaterThan(AVAIL);
    } finally {
      style.remove();
    }
  });
});

describe('u-outlet — 가로 폭', () => {
  it('넓은 자손이 라우트 화면을 부모 폭 너머로 늘리지 않는다 — 표는 자기 가로 스크롤로 굴러간다', async () => {
    const parent = document.createElement('div');
    parent.style.cssText = 'width: 600px; height: 400px;';
    document.body.appendChild(parent);
    const outlet = document.createElement('u-outlet');
    parent.appendChild(outlet);
    const screen = document.createElement('div');
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display: flex; justify-content: space-between;';
    toolbar.innerHTML = '<span>Title</span><button>Add</button>';
    const scroller = document.createElement('div');
    scroller.style.overflowX = 'auto';
    scroller.innerHTML = '<div style="width: 2000px; height: 20px"></div>';
    screen.append(toolbar, scroller);
    outlet.appendChild(screen);
    await settle();
    try {
      expect(w(screen)).toBe(600);
      expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
      const button = toolbar.querySelector('button')!;
      expect(Math.round(button.getBoundingClientRect().right)).toBeLessThanOrEqual(Math.round(parent.getBoundingClientRect().right));
    } finally {
      document.body.replaceChildren();
    }
  });
});

/**
 * **인쇄 매체** — 화면의 마지막 블록이 `margin-bottom` 을 가져도 빈 꼬리 쪽이 생기지 않아야 한다.
 * 그 여백이 어느 상자 안에 갇히면 상자 높이가 여백만큼 늘고, 내용 끝이 쪽 경계에서 그 여백 이내에
 * 있으면 여백만 담긴 쪽이 찍힌다(CSS Fragmentation §5.2). 상자가 없으면 가둘 곳이 없다.
 */
describe('u-outlet — 인쇄 매체', () => {
  const CONTENT = 300;
  const MARGIN = 24;
  let shell: HTMLDivElement;
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
    const outlet = document.createElement('u-outlet');
    shell.appendChild(outlet);
    const route = document.createElement('div');
    const last = document.createElement('div');
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

  it('🔴인쇄 매체에서 끝 블록의 아래 여백이 셸 «밖» 으로 접힌다 — 셸 높이에 들어오지 않는다', async () => {
    await setMedia('print');
    expect(h(shell)).toBe(CONTENT);
  });
});

// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../src/components/UOutlet.js';

/**
 * docket #302 — `<u-outlet>` 은 스타일 없는 `HTMLElement` 라 UA 기본 `display: inline` 을
 * 그대로 가졌고, 라우트 화면(블록 요소들)을 인라인 상자에 담아 block-in-inline 분할을
 * 만들었다(인쇄에서 짧은 문서에 빈 꼬리 쪽이 붙는 형태로 관측됐다).
 *
 * 이 테스트가 고정하는 것은 셋이다:
 *   ⑴ 연결되면 자기가 속한 트리에 표시 규칙이 실린다
 *   ⑵ 그 규칙의 특이도가 0 이라 소비자 규칙이 `!important` 없이 이긴다
 *   ⑶ 섀도 루트 안의 아웃렛도 규칙을 받는다(문서 시트는 거기 닿지 않는다)
 */
describe('UOutlet — 자기 표시 방식 선언 (docket #302)', () => {
  let hosts: HTMLElement[] = [];

  const track = <T extends HTMLElement>(el: T): T => {
    hosts.push(el);
    return el;
  };

  /** 트리에 실린 규칙 텍스트 전부 — 채택 시트와 `<style>` 폴백을 함께 본다. */
  const rulesIn = (root: Document | ShadowRoot): string => {
    const adopted = (root.adoptedStyleSheets ?? [])
      .flatMap(sheet => Array.from(sheet.cssRules).map(rule => rule.cssText))
      .join('\n');
    const inline = Array.from(root.querySelectorAll('style'))
      .map(style => style.textContent ?? '')
      .join('\n');
    return `${adopted}\n${inline}`;
  };

  beforeEach(() => {
    hosts = [];
  });

  afterEach(() => {
    hosts.forEach(el => el.remove());
    document.head.querySelectorAll('style').forEach(el => el.remove());
  });

  it('연결되면 문서 트리에 display 규칙이 실린다', () => {
    const outlet = track(document.createElement('u-outlet'));
    document.body.appendChild(outlet);

    expect(rulesIn(document)).toMatch(/u-outlet/);
    expect(rulesIn(document)).toMatch(/display:\s*grid/);
    // `display` 만으로는 부족하다 — 백분율 높이의 기준 상자가 아웃렛 자신으로 바뀌므로,
    // 채우기 선언이 없으면 «화면을 채우는» 레이아웃이 내용 높이로 무너진다(cycle-628 실측).
    // 🔴그리고 그 선언은 `height` 가 아니라 `min-height` 여야 한다 — `height` 는 넘치는 화면에서
    //   아웃렛을 못 박아 셸의 끝 거터를 먹는다(cycle-645 · docket #308 2차 실측).
    //   ⚠happy-dom 은 레이아웃을 계산하지 않으므로 이 파일은 «규칙이 실렸는가» 까지만 말할 수
    //   있다 — «그래서 어떻게 배치되는가» 는 `tests/browser/outlet-box-model.browser.test.ts`.
    expect(rulesIn(document)).toMatch(/min-height:\s*100%/);
    expect(rulesIn(document)).not.toMatch(/[^-]height:\s*100%/);
  });

  it('규칙의 특이도가 0 이다 — 소비자의 `u-outlet {…}` 가 이긴다', () => {
    const outlet = track(document.createElement('u-outlet'));
    document.body.appendChild(outlet);

    // `:where()` 안에 있어야 특이도가 0 이다. 맨 선택자로 적히면 (0,0,1) 이 되어
    // 소비자 규칙과 동률이 되고, 그때는 «나중에 온 쪽» 이라는 순서 싸움이 된다.
    expect(rulesIn(document)).toMatch(/:where\(\s*u-outlet\s*\)/);
  });

  it('섀도 루트 안의 아웃렛은 그 섀도 루트가 규칙을 받는다', () => {
    const host = track(document.createElement('div'));
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.appendChild(document.createElement('u-outlet'));

    // 문서 시트는 섀도 경계를 넘지 못하므로, 규칙은 섀도 루트 자신에 있어야 한다.
    expect(rulesIn(shadow)).toMatch(/display:\s*grid/);
  });

  it('같은 트리에 아웃렛이 여럿이어도 규칙은 한 벌만 실린다', () => {
    for (let i = 0; i < 3; i += 1) {
      const outlet = track(document.createElement('u-outlet'));
      document.body.appendChild(outlet);
    }

    const occurrences = rulesIn(document).match(/u-outlet/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });
});

// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../src/components/UOutlet.js';

/**
 * `<u-outlet>` 은 자기 표시 방식을 선언한다 — 스타일 없는 커스텀 엘리먼트의 UA 기본값 `inline` 은
 * 라우트 화면(블록 요소들)을 인라인 상자에 담아 block-in-inline 분할을 만든다.
 *
 * 이 테스트가 고정하는 것은 셋이다:
 *   ⑴ 연결되면 자기가 속한 트리에 표시 규칙(`display: contents`)이 실린다
 *   ⑵ 그 규칙의 특이도가 0 이라 소비자 규칙이 `!important` 없이 이긴다
 *   ⑶ 섀도 루트 안의 아웃렛도 규칙을 받는다(문서 시트는 거기 닿지 않는다)
 *
 * ⚠happy-dom 은 레이아웃을 계산하지 않으므로 이 파일은 «규칙이 실렸는가» 까지만 말할 수 있다 —
 *   «그래서 어떻게 배치되는가» 는 `tests/browser/outlet-box-model.browser.test.ts`.
 */
describe('UOutlet — 자기 표시 방식 선언', () => {
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

  it('연결되면 문서 트리에 display 규칙이 실린다 — 상자를 만들지 않는다', () => {
    const outlet = track(document.createElement('u-outlet'));
    document.body.appendChild(outlet);

    expect(rulesIn(document)).toMatch(/u-outlet/);
    expect(rulesIn(document)).toMatch(/display:\s*contents/);
    // 상자가 없으므로 높이·트랙 선언도 없어야 한다 — 있으면 무효이거나, 되살아난 상자의 흔적이다.
    expect(rulesIn(document)).not.toMatch(/height|grid|@media print/);
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
    expect(rulesIn(shadow)).toMatch(/display:\s*contents/);
  });

  it('같은 트리에 아웃렛이 여럿이어도 규칙은 한 벌만 실린다', () => {
    for (let i = 0; i < 3; i += 1) {
      const outlet = track(document.createElement('u-outlet'));
      document.body.appendChild(outlet);
    }

    // 한 벌 = 규칙 하나. 아웃렛 수에 비례하면 안 된다.
    const occurrences = rulesIn(document).match(/u-outlet/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });
});

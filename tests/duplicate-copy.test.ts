// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { defineElement } from '../src/internals/define-element.js';

/**
 * 이 패키지의 사본이 둘 실리면(넓은 peer 범위가 옛 판을 붙잡은 설치 등) 두 번째 사본의 등록이
 * 브라우저의 기본 오류(«이름이 이미 쓰였다»)로 죽는다 — 원인(사본 둘)을 말하지 않는다.
 * 고정하는 것: ⑴ 다른 생성자면 원인과 확인 방법을 말하며 멈춘다 ⑵ 같은 생성자면 무동작
 * ⑶ 실제로 모듈을 한 번 더 평가하면(= 두 번째 사본) 그 오류가 난다.
 */
describe('defineElement — 같은 이름의 다른 정의', () => {
  it('처음이면 등록한다', () => {
    class First extends HTMLElement {}
    defineElement('x-define-first', First);
    expect(customElements.get('x-define-first')).toBe(First);
  });

  it('같은 생성자로 다시 부르면 아무 일도 하지 않는다', () => {
    class Same extends HTMLElement {}
    defineElement('x-define-same', Same);
    expect(() => defineElement('x-define-same', Same)).not.toThrow();
  });

  it('다른 생성자면 사본 둘을 의심하라고 말하며 멈춘다', () => {
    class A extends HTMLElement {}
    class B extends HTMLElement {}
    defineElement('x-define-other', A);
    expect(() => defineElement('x-define-other', B)).toThrow(/another copy of @iyulab\/router[\s\S]*npm ls @iyulab\/router/);
    expect(customElements.get('x-define-other')).toBe(A);
  });

  it('모듈을 다시 평가하면(두 번째 사본) <u-link> 등록이 그 오류로 멈춘다', async () => {
    await import('../src/components/ULink.js');
    vi.resetModules();
    await expect(import('../src/components/ULink.js')).rejects.toThrow(/<u-link> is already defined[\s\S]*another copy of @iyulab\/router/);
  });
});

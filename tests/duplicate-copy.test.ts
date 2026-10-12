// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { assertNotDefined } from '../src/internals/single-copy.js';

/**
 * 이 패키지의 사본이 둘 실리면(넓은 peer 범위가 옛 판을 붙잡은 설치 등) 두 번째 사본의 등록이
 * 브라우저의 기본 오류(«이름이 이미 쓰였다»)로 죽는다 — 원인(사본 둘)을 말하지 않는다.
 * 고정하는 것: ⑴ 비어 있는 이름이면 지나간다 ⑵ 이미 있으면 원인과 확인 방법을 말하며 멈춘다
 * ⑶ 실제로 모듈을 한 번 더 평가하면(= 두 번째 사본) 그 오류가 난다.
 */
describe('assertNotDefined — 같은 이름의 다른 정의', () => {
  it('비어 있는 이름이면 지나간다', () => {
    expect(() => assertNotDefined('x-single-free')).not.toThrow();
  });

  it('이미 정의된 이름이면 사본 둘을 의심하라고 말하며 멈춘다', () => {
    customElements.define('x-single-taken', class extends HTMLElement {});
    expect(() => assertNotDefined('x-single-taken')).toThrow(/another copy of @iyulab\/router[\s\S]*npm ls @iyulab\/router/);
  });

  it('모듈을 다시 평가하면(두 번째 사본) <u-link> 등록이 그 오류로 멈춘다', async () => {
    await import('../src/components/ULink.js');
    vi.resetModules();
    await expect(import('../src/components/ULink.js')).rejects.toThrow(/<u-link> is already defined[\s\S]*another copy of @iyulab\/router/);
  });
});

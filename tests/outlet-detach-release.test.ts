// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, useEffect } from 'react';
import '../src/components/UOutlet.js';
import type { UOutlet } from '../src/components/UOutlet.js';

/**
 * 떼어지는 `<u-outlet>` 은 자기 React 뿌리를 거둔다.
 *
 * 중첩 라우트에서 안쪽 아웃렛은 바깥 화면 안에 있다. 바깥 화면이 다른 라우트로 바뀌면 안쪽 아웃렛은
 * DOM 에서 떨어질 뿐 `render()` 를 다시 받지 않는다 — 종전에는 그때 뿌리가 `unmount()` 되지 않아
 * 안의 효과 정리가 돌지 않았다(저장 안 한 변경 · 이벤트 구독이 남는다).
 *
 * ★NEGATIVE: 같은 틱에 떼었다 다시 붙이는 이동은 내용을 유지한다 · 연결된 채로는 아무것도 거두지 않는다.
 * ★회귀 하나: 동적 import 를 기다리는 사이에 떨어진 아웃렛의 마운트는 뿌리를 버린다.
 */

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const settle = async () => {
  for (let i = 0; i < 4; i += 1) await tick();
};

describe('u-outlet — 떼어질 때 React 뿌리를 거둔다', () => {
  let host: HTMLElement;
  let outlet: UOutlet;
  let log: string[];

  const probe = () => {
    function Probe() {
      useEffect(() => {
        log.push('mount');
        return () => { log.push('cleanup'); };
      }, []);
      return createElement('p', { className: 'probe' }, 'probe');
    }
    return createElement(Probe);
  };

  beforeEach(() => {
    log = [];
    host = document.createElement('div');
    outlet = document.createElement('u-outlet') as UOutlet;
    host.appendChild(outlet);
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('부모 화면이 바뀌어 아웃렛이 떨어지면 안쪽 React 효과의 정리가 돈다', async () => {
    await outlet.render(probe(), { id: 'inner' });
    await settle();
    expect(log).toEqual(['mount']);

    host.remove(); // 바깥 화면 교체 — 아웃렛은 render() 를 다시 받지 않는다
    await settle();

    expect(log).toEqual(['mount', 'cleanup']);
  });

  it('NEGATIVE: 같은 틱에 떼었다 다시 붙이면(이동) 내용과 뿌리를 유지한다', async () => {
    await outlet.render(probe(), { id: 'inner' });
    await settle();

    const other = document.createElement('section');
    document.body.appendChild(other);
    other.appendChild(outlet); // 이동 — disconnect 뒤 곧바로 connect
    await settle();

    expect(log).toEqual(['mount']);
    expect(outlet.querySelector('p.probe')).toBeTruthy();
    other.remove();
  });

  it('NEGATIVE: 연결된 채로는 거두지 않는다', async () => {
    await outlet.render(probe(), { id: 'inner' });
    await settle();
    expect(log).toEqual(['mount']);
    expect(outlet.querySelector('p.probe')).toBeTruthy();
  });

  it('떨어진 뒤에 끝나는 마운트는 뿌리를 버린다', async () => {
    const pending = outlet.render(probe(), { id: 'inner' }); // 동적 import 를 기다리는 구간
    host.remove(); // 마운트가 끝나기 전에 떨어진다
    await pending;
    await settle();

    expect(log.filter((e) => e === 'cleanup').length).toBe(log.filter((e) => e === 'mount').length);
    expect(outlet.querySelector('p.probe')).toBeNull();
  });
});

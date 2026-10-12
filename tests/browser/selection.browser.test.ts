/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LitElement, html } from 'lit';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import React from 'react';
import { Router, selection, SelectionController } from '../../src/index.js';
import { useSelection } from '../../src/react.js';
import '../../src/components/UOutlet.js';

/**
 * **여러 뷰가 «지금 고른 것» 하나를 따라간다.** 이동이 «어느 화면인가» 라면 선택은 «그 화면 안에서 무엇을 보는가» 다 —
 * 목록 · 곁 패널 · 열린 탭이 같은 선택을 공유하려면 앱마다 현재 값 · 구독 · 늦은 응답 버리기 · 주소 직렬화를 다시 짰다.
 * 채널은 이름으로 공유되고, `query` 를 주면 주소가 원천이다(딥링크 · Back).
 *
 * hash 모드 실브라우저. 채널은 문서 하나에 이름별로 하나라 시험마다 다른 이름을 쓴다.
 */
const settle = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 40));
};
const until = async (fn: () => boolean, what: string) => {
  for (let i = 0; i < 60; i++) {
    if (fn()) return;
    await settle();
  }
  throw new Error(`기다렸지만 일어나지 않았다: ${what}`);
};

const startPath = window.location.pathname + window.location.search;
let root: HTMLElement;
let router: Router | undefined;

beforeEach(() => {
  history.replaceState(null, '', startPath);
  root = document.createElement('div');
  root.appendChild(document.createElement('u-outlet'));
  document.body.appendChild(root);
});
afterEach(() => {
  router?.destroy();
  router = undefined;
  root.remove();
  history.replaceState(null, '', startPath);
});

const mount = () => {
  router = new Router({
    root,
    mode: 'hash',
    initialLoad: false,
    routes: [
      {
        path: '/list',
        // 선택(쿼리)만 바뀌는 이동에서 화면을 다시 만들지 않는다 — 목록 상태가 남는다.
        key: () => 'list',
        render: () => {
          const s = document.createElement('section');
          s.setAttribute('data-screen', 'list');
          return s;
        },
      },
    ],
  });
  return router;
};

describe('selection — 채널', () => {
  it('같은 이름은 같은 채널 — 모든 구독자가 같은 값을 받는다', () => {
    const a = selection<string>('t-shared');
    const b = selection<string>('t-shared');
    expect(a).toBe(b);
    const seen: Array<string | undefined> = [];
    a.subscribe((v) => seen.push(v));
    b.subscribe((v) => seen.push(v));
    b.set('x');
    expect(seen).toEqual(['x', 'x']);
    expect(a.value).toBe('x');
  });

  it('최신 것이 이긴다 — 앞 선택의 신호는 다음 선택에서 중단된다', () => {
    const c = selection<string>('t-latest');
    const signals: AbortSignal[] = [];
    c.subscribe((_v, signal) => signals.push(signal));
    c.set('a');
    c.set('b');
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
    c.set('b'); // 같은 값 — 알리지 않는다
    expect(signals).toHaveLength(2);
  });

  it('고정한 뷰는 따라가지 않고, 풀면 지금 값으로 맞춘다', () => {
    const c = selection<string>('t-pin');
    const seen: Array<string | undefined> = [];
    const view = c.follow((v) => seen.push(v));
    c.set('1');
    view.pin();
    c.set('2');
    c.set('3');
    expect(seen).toEqual([undefined, '1']);
    view.unpin();
    expect(seen).toEqual([undefined, '1', '3']);
    view.dispose();
  });
});

describe('selection — 주소가 원천', () => {
  it('바꾸면 주소 쿼리에 남고(기본 replace — 기록이 쌓이지 않는다) 라우터 문맥이 그것을 본다', async () => {
    const r = mount();
    await r.go('/list');
    const before = history.length;
    const c = selection<string>('t-q', { query: 'order' });
    c.set('G-7');
    await until(() => r.context?.query.get('order') === 'G-7', '라우터 문맥 쿼리');
    expect(location.hash).toBe('#/list?order=G-7');
    expect(history.length).toBe(before);
    c.set(undefined);
    await until(() => location.hash === '#/list', '쿼리 제거');
  });

  it("history: 'push' 면 선택 하나가 기록 항목 하나 — Back 이 앞 선택으로 돌아간다", async () => {
    const r = mount();
    await r.go('/list');
    const c = selection<number>('t-push', { query: 'n', history: 'push', parse: Number, format: String });
    const seen: Array<number | undefined> = [];
    c.subscribe((v) => seen.push(v));
    c.set(1);
    await until(() => location.hash === '#/list?n=1', 'n=1');
    c.set(2);
    await until(() => location.hash === '#/list?n=2', 'n=2');
    history.back();
    await until(() => c.value === 1, 'Back 뒤 1');
    expect(seen).toEqual([1, 2, 1]);
  });

  it('딥링크 — 주소에 있던 값으로 시작한다(라우터가 먼저 섰을 때)', async () => {
    history.replaceState(null, '', startPath + '#/list?doc=3');
    mount();
    const c = selection<number>('t-deep', { query: 'doc', parse: Number });
    expect(c.value).toBe(3);
  });

  it('라우터보다 먼저 만든 채널도 라우터가 서면 주소의 값을 받는다(hash 모드)', async () => {
    history.replaceState(null, '', startPath + '#/list?early=5');
    const c = selection<number>('t-early', { query: 'early', parse: Number });
    const seen: Array<number | undefined> = [];
    c.subscribe((v) => seen.push(v));
    mount();
    expect(c.value).toBe(5);
    expect(seen).toEqual([5]);
  });

  it('라우터가 없으면 문서를 떠나지 않고 기록만 고친다', () => {
    const c = selection<string>('t-norouter', { query: 'pick' });
    c.set('a b');
    expect(new URL(location.href).searchParams.get('pick')).toBe('a b');
    expect(c.value).toBe('a b');
  });
});

describe('selection — 뷰 어댑터', () => {
  it('Lit: SelectionController 가 값이 바뀌면 다시 그리고, 고정하면 멈춘다', async () => {
    class SelView extends LitElement {
      sel = new SelectionController(this, selection<string>('t-lit'));
      render() { return html`<span>${this.sel.value ?? 'none'}</span>`; }
    }
    customElements.define('x-sel-view', SelView);
    const el = document.createElement('x-sel-view') as SelView;
    document.body.appendChild(el);
    await el.updateComplete;
    const text = () => el.shadowRoot!.querySelector('span')!.textContent;
    expect(text()).toBe('none');
    el.sel.channel.set('A');
    await el.updateComplete;
    expect(text()).toBe('A');
    el.sel.pin();
    el.sel.channel.set('B');
    await el.updateComplete;
    expect(text()).toBe('A');
    el.sel.unpin();
    await el.updateComplete;
    expect(text()).toBe('B');
    el.remove();
  });

  it('React: useSelection 이 값과 설정 함수를 준다', async () => {
    const channel = selection<string>('t-react');
    let set!: (v: string | undefined) => void;
    function View() {
      const [value, setValue] = useSelection(channel);
      set = setValue;
      return React.createElement('output', null, value ?? 'none');
    }
    const host = document.body.appendChild(document.createElement('div'));
    const r = createRoot(host);
    flushSync(() => r.render(React.createElement(View)));
    expect(host.textContent).toBe('none');
    flushSync(() => channel.set('one'));
    expect(host.textContent).toBe('one');
    flushSync(() => set('two'));
    expect(channel.value).toBe('two');
    expect(host.textContent).toBe('two');
    r.unmount();
    host.remove();
  });
});

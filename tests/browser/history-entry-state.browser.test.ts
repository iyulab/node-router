/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router } from '../../src/Router.js';
import '../../src/components/UOutlet.js';

/**
 * **기록 항목의 상태는 그 항목에 돌아와도 남는다.**
 *
 * `go(href, { state })` 가 실은 상태는 `history.state` 로 다시 읽을 수 있다고 약속한다. 그런데 Back 이 낸 `popstate` 를
 * 받은 라우터가 같은 주소로 `go()` 하면서 그 항목을 `{ basepath, mode }` 로 덮어써, 돌아오는 순간 상태가 지워졌다 —
 * 브라우저는 `popstate` 의 `e.state` 로 상태를 돌려주는데도. 첫 로드(새로 고침)도 같은 길이었다.
 * 항목별로 무언가를 기억해 Back 에서 되돌리는 기능(스크롤 · 선택)은 이 위에 선다.
 *
 * hash 모드로 잰다 — 경로 라우팅은 시험 iframe 의 문서를 잃는다(hash-mode 시험 주석 참조).
 */
const settle = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 40));
};
const screenIn = (root: HTMLElement) =>
  root.querySelector('u-outlet')?.querySelector('[data-screen]')?.getAttribute('data-screen') ?? null;
const until = async (fn: () => boolean, what: string) => {
  for (let i = 0; i < 50; i++) {
    if (fn()) return;
    await settle();
  }
  throw new Error(`기다렸지만 일어나지 않았다: ${what}`);
};
const page = (name: string) => () => {
  const s = document.createElement('section');
  s.setAttribute('data-screen', name);
  return s;
};
const state = () => history.state as Record<string, unknown> | null;

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

const mount = (initialLoad = true) => {
  router = new Router({
    root,
    mode: 'hash',
    initialLoad,
    routes: [
      { path: '/', render: page('home') },
      { path: '/a', render: page('a') },
      { path: '/b', render: page('b') },
    ],
  });
  return router;
};

describe('router — 기록 항목의 상태', () => {
  it('뒤로 가기로 돌아온 항목은 실었던 상태를 그대로 갖는다', async () => {
    const r = mount(false);
    await r.go('/a', { state: { marker: 'A' } });
    await r.go('/b');
    history.back();
    await until(() => screenIn(root) === 'a', 'a');
    await settle();
    expect(state()).toMatchObject({ marker: 'A', mode: 'hash', basepath: '/' });
  });

  it('앞으로 가기도 같다', async () => {
    const r = mount(false);
    await r.go('/a');
    await r.go('/b', { state: { marker: 'B' } });
    history.back();
    await until(() => screenIn(root) === 'a', 'a');
    history.forward();
    await until(() => screenIn(root) === 'b', 'b');
    await settle();
    expect(state()).toMatchObject({ marker: 'B' });
  });

  it('첫 로드(새로 고침)도 그 항목의 상태를 지우지 않는다', async () => {
    history.replaceState({ marker: 'R' }, '', startPath + '#/b');
    mount();
    await until(() => screenIn(root) === 'b', 'b');
    await settle();
    expect(state()).toMatchObject({ marker: 'R', mode: 'hash' });
  });

  it('같은 주소로 다시 가면 새 상태가 기존 상태 위에 얹힌다', async () => {
    const r = mount(false);
    await r.go('/a', { state: { tab: 'x' } });
    await r.go('/a', { state: { scroll: 3 } });
    expect(state()).toMatchObject({ tab: 'x', scroll: 3 });
  });

  it('⚪NEGATIVE — 다른 주소로의 교체는 새 위치라 옛 상태를 잇지 않는다', async () => {
    const r = mount(false);
    await r.go('/a', { state: { marker: 'A' } });
    await r.go('/b', { replace: true });
    expect(state()).not.toHaveProperty('marker');
    expect(state()).toMatchObject({ mode: 'hash' });
  });
});

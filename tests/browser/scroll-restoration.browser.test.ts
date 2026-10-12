/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router } from '../../src/Router.js';
import '../../src/components/UOutlet.js';

/**
 * **뒤로 가기로 돌아오면 보던 자리.** 셸이 문서가 아니라 안쪽 상자를 굴리면 브라우저의 기본 복원(문서 스크롤만)이 닿지 않고,
 * 비동기로 그려지는 화면은 내용이 서기 전에 위치가 잘린다. 라우터가 이동 종류(`navigation.type`)와 렌더 완료를 알아 그 일을 한다.
 *
 * hash 모드 실브라우저 — 스크롤하는 상자(높이 300px)가 라우터 루트다.
 */
const settle = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 40));
};
const until = async (fn: () => boolean, what: string, tries = 80) => {
  for (let i = 0; i < tries; i++) {
    if (fn()) return;
    await settle();
  }
  throw new Error(`기다렸지만 일어나지 않았다: ${what}`);
};
const screenIn = (root: HTMLElement) =>
  root.querySelector('u-outlet')?.querySelector('[data-screen]')?.getAttribute('data-screen') ?? null;
const tall = (name: string, height = 3000) => () => {
  const s = document.createElement('section');
  s.setAttribute('data-screen', name);
  s.style.height = `${height}px`;
  return s;
};
/** 데이터를 받은 뒤에야 높이가 생기는 화면 — 처음엔 짧고 400ms 뒤 3000px. */
const late = (name: string) => () => {
  const s = tall(name, 100)();
  setTimeout(() => { s.style.height = '3000px'; }, 400);
  return s;
};

const startPath = window.location.pathname + window.location.search;
let box: HTMLElement;
let router: Router | undefined;

beforeEach(() => {
  history.replaceState(null, '', startPath);
  box = document.createElement('div');
  box.style.cssText = 'height: 300px; overflow: auto;';
  box.appendChild(document.createElement('u-outlet'));
  document.body.appendChild(box);
});
afterEach(() => {
  router?.destroy();
  router = undefined;
  box.remove();
  history.replaceState(null, '', startPath);
});

const mount = (scrollRestoration: boolean = true) => {
  router = new Router({
    root: box,
    mode: 'hash',
    initialLoad: false,
    scrollRestoration: scrollRestoration ? { container: () => box } : false,
    routes: [
      { path: '/a', render: tall('a') },
      { path: '/b', render: tall('b') },
      { path: '/late', render: late('late') },
    ],
  });
  return router;
};

describe('router — scrollRestoration', () => {
  it('새 이동은 맨 위로', async () => {
    const r = mount();
    await r.go('/a');
    box.scrollTop = 500;
    await r.go('/b');
    expect(box.scrollTop).toBe(0);
  });

  it('뒤로 가기로 돌아오면 그 항목에서 보던 자리', async () => {
    const r = mount();
    await r.go('/a');
    box.scrollTop = 800;
    await r.go('/b');
    box.scrollTop = 200;
    history.back();
    await until(() => screenIn(box) === 'a', 'a');
    await until(() => box.scrollTop === 800, 'scrollTop 800');
    history.forward();
    await until(() => screenIn(box) === 'b', 'b');
    await until(() => box.scrollTop === 200, 'scrollTop 200');
  });

  it('늦게 자라는 화면은 내용이 그 위치까지 자랄 때까지 기다렸다 되돌린다', async () => {
    const r = mount();
    await r.go('/late');
    await until(() => box.scrollHeight > 2000, 'late 높이');
    box.scrollTop = 1200;
    await r.go('/b');
    history.back();
    await until(() => screenIn(box) === 'late', 'late');
    expect(box.scrollHeight).toBeLessThan(1200); // 아직 짧다 — 지금 되돌리면 잘린다
    await until(() => box.scrollTop === 1200, 'scrollTop 1200');
  });

  it('사람이 먼저 굴리면 복원을 멈춘다', async () => {
    const r = mount();
    await r.go('/late');
    await until(() => box.scrollHeight > 2000, 'late 높이');
    box.scrollTop = 1200;
    await r.go('/b');
    history.back();
    await until(() => screenIn(box) === 'late', 'late');
    box.dispatchEvent(new WheelEvent('wheel', { deltaY: 10 }));
    await new Promise((r2) => setTimeout(r2, 700));
    expect(box.scrollTop).not.toBe(1200);
  });

  it('교체(같은 주소)는 위치를 건드리지 않는다', async () => {
    const r = mount();
    await r.go('/a');
    box.scrollTop = 300;
    await r.go('/a');
    expect(box.scrollTop).toBe(300);
  });

  it('새로 고침 직전(pagehide) 지금 항목의 위치를 항목 상태에 남긴다', async () => {
    const r = mount();
    await r.go('/a');
    box.scrollTop = 450;
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
    expect((history.state as { scroll?: unknown }).scroll).toEqual({ x: 0, y: 450 });
  });

  it('⚪NEGATIVE — 기본은 꺼짐: 브라우저 복원을 바꾸지 않고 위치도 건드리지 않는다', async () => {
    const r = mount(false);
    expect(history.scrollRestoration).toBe('auto');
    await r.go('/a');
    box.scrollTop = 500;
    await r.go('/b');
    expect(box.scrollTop).toBe(500);
  });

  it('켜면 브라우저의 문서 복원을 끄고, 끝내면 되돌린다', async () => {
    const r = mount();
    expect(history.scrollRestoration).toBe('manual');
    r.destroy();
    router = undefined;
    expect(history.scrollRestoration).toBe('auto');
  });
});

/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router } from '../../src/Router.js';
import '../../src/components/UOutlet.js';
import '../../src/components/ULink.js';
import type { ULink } from '../../src/components/ULink.js';

/**
 * **hash 모드 — 라우트는 `#` 뒤에 산다.**
 *
 * 정적 호스팅(서버가 문서 하나만 돌려준다)에서는 경로 라우팅의 새로고침·딥링크가 서버 설정(SPA fallback) 없이는
 * 동작하지 않는다. hash 모드는 라우트를 `#/orders/7` 처럼 조각 식별자에 실어, 서버가 보는 경로를 바꾸지 않는다.
 *
 * ## 왜 브라우저인가
 *
 * 계약이 «주소창에 무엇이 쓰이는가» 와 «조각 이동이 라우팅을 일으키는가»(뒤로 가기 · 주소 직접 수정 · `#/x` 앵커)라
 * 실제 히스토리·조각 이동 의미론이 필요하다. ⚠경로 라우팅(history 모드)은 여기서 재지 않는다 — 시험 iframe 의 경로를
 * 바꾸면 러너가 문서를 잃는다. 그 모드는 유닛 스위트가 덮는다.
 */

const settle = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 40));
};

/** 라우터가 그린 화면의 표지(`data-screen`)를 읽는다 — 아직 아무것도 없으면 `null`. */
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
      { path: '/orders/:id', render: (ctx) => page(`order ${ctx.params.id}`)() },
      { path: '/items', render: page('items') },
    ],
  });
  return router;
};

describe('router — hash 모드', () => {
  it('🔴첫 진입: `#` 뒤의 경로로 라우팅한다(딥링크)', async () => {
    history.replaceState(null, '', startPath + '#/orders/7');
    mount();
    await until(() => screenIn(root) === 'order 7', 'order 7');
  });

  it('`#` 이 없으면 루트(`/`)다', async () => {
    mount();
    await until(() => screenIn(root) === 'home', 'home');
    expect(window.location.hash).toBe('#/');
  });

  it('🔴go() 는 경로가 아니라 `#` 뒤를 바꾼다 — 서버가 보는 경로는 그대로다', async () => {
    const r = mount();
    await until(() => screenIn(root) === 'home', 'home');
    await r.go('/items');
    expect(screenIn(root)).toBe('items');
    expect(window.location.hash).toBe('#/items');
    expect(window.location.pathname + window.location.search).toBe(startPath);
  });

  it('🔴뒤로 가기가 앞 화면으로 돌아간다', async () => {
    const r = mount();
    await until(() => screenIn(root) === 'home', 'home');
    await r.go('/orders/3');
    await r.go('/items');
    history.back();
    await until(() => screenIn(root) === 'order 3', '뒤로 → order 3');
    expect(window.location.hash).toBe('#/orders/3');
  });

  it('🔴주소의 `#` 을 직접 바꾸면 그 화면으로 간다', async () => {
    mount();
    await until(() => screenIn(root) === 'home', 'home');
    window.location.hash = '#/orders/9';
    await until(() => screenIn(root) === 'order 9', 'order 9');
  });

  it('🔴`#/x` 앵커 클릭이 라우팅된다', async () => {
    mount();
    await until(() => screenIn(root) === 'home', 'home');
    const a = document.createElement('a');
    a.href = '#/items';
    a.textContent = 'items';
    root.appendChild(a);
    a.click();
    await until(() => screenIn(root) === 'items', 'items');
    expect(window.location.hash).toBe('#/items');
  });

  it('🔴`u-link` 는 라우트 경로를 `#` 뒤에 싣는다 — 새 탭·주소 복사가 같은 화면을 연다', async () => {
    mount();
    await until(() => screenIn(root) === 'home', 'home');
    const link = document.createElement('u-link') as ULink;
    link.href = '/orders/5';
    link.textContent = 'order';
    root.appendChild(link);
    const inner = link.shadowRoot!.querySelector('a')!;
    expect(inner.getAttribute('href')).toBe('#/orders/5');

    link.click();
    await until(() => screenIn(root) === 'order 5', 'order 5');
    expect(window.location.hash).toBe('#/orders/5');
  });

  it('🔴라우터보다 먼저 붙은 `u-link` 도 hash 주소로 다시 그려진다 — 셸을 먼저 그리는 앱의 첫 방문', async () => {
    // 첫 방문: 히스토리 상태가 비어 있다(새로고침은 상태를 보존하므로 이 경로를 재현하지 못한다).
    expect(history.state).toBeNull();
    const users = document.createElement('u-link') as ULink;
    users.href = '/orders/5';
    const logo = document.createElement('u-link') as ULink; // href 없음 = basepath
    root.append(users, logo);
    const usersA = users.shadowRoot!.querySelector('a')!;
    const logoA = logo.shadowRoot!.querySelector('a')!;
    expect(usersA.getAttribute('href'), '라우터 전에는 아직 모드를 모른다').toBe('/orders/5');

    mount(false);
    expect(usersA.getAttribute('href')).toBe('#/orders/5');
    expect(logoA.getAttribute('href')).toBe('#/');
  });

  it('NEGATIVE 떼어 낸 `u-link` 는 라우터 상태 알림을 받지 않는다', () => {
    const link = document.createElement('u-link') as ULink;
    link.href = '/orders/5';
    root.appendChild(link);
    link.remove();
    mount(false);
    expect(link.shadowRoot!.querySelector('a')!.getAttribute('href')).toBe('/orders/5');
  });

  it('쿼리는 `#` 뒤 라우트의 쿼리다', async () => {
    const r = mount();
    await until(() => screenIn(root) === 'home', 'home');
    await r.go('/items?page=2');
    expect(r.context?.query.get('page')).toBe('2');
    expect(window.location.hash).toBe('#/items?page=2');
    expect(window.location.search).toBe(new URL(startPath, location.origin).search);
  });

  it('NEGATIVE 라우터의 모드는 `mode` 로 읽힌다 — 생략하면 history', () => {
    const r = new Router({ root, initialLoad: false, routes: [] });
    expect(r.mode).toBe('history');
    r.destroy();
    expect(mount(false).mode).toBe('hash');
  });
});

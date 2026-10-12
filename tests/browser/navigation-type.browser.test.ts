/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Router, navigate } from '../../src/index.js';
import '../../src/components/UOutlet.js';
import '../../src/components/ULink.js';
import type { RouteNavigation } from '../../src/types/RouteContext.js';
import type { RouteDoneEvent } from '../../src/types/RouteEvent.js';

/**
 * **라우터는 «어떻게 왔는가» 를 안다** — 이동 종류(`push` · `replace` · `traverse` · `reload`)와 기록 항목 키.
 *
 * 그것 없이는 «돌아왔으면 스크롤·선택을 되돌리고, 새로 왔으면 맨 위» 를 지을 수 없다. 그리고 `u-link` 는 이동을
 * `history.pushState` + 상태 없는 합성 `popstate` 로 흉내 냈다 — 앱이 듣는 `popstate` 가 진짜 뒤로 가기와 링크 이동을
 * 가리지 못했고, 라우터 자신도 둘을 같은 길로 처리했다. 이제 `u-link`·`navigate()` 는 라우터에 이동을 «요청» 한다.
 *
 * hash 모드로 잰다(경로 라우팅은 시험 iframe 의 문서를 잃는다).
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

const startPath = window.location.pathname + window.location.search;
let root: HTMLElement;
let router: Router | undefined;
let done: RouteNavigation[] = [];
let popstates = 0;
const onDone = (e: Event) => done.push({ ...(e as RouteDoneEvent).context.navigation });
const onPop = () => { popstates++; };

beforeEach(() => {
  history.replaceState(null, '', startPath);
  root = document.createElement('div');
  root.appendChild(document.createElement('u-outlet'));
  document.body.appendChild(root);
  done = [];
  popstates = 0;
  window.addEventListener('route-done', onDone);
  window.addEventListener('popstate', onPop);
});
afterEach(() => {
  window.removeEventListener('route-done', onDone);
  window.removeEventListener('popstate', onPop);
  router?.destroy();
  router = undefined;
  root.remove();
  history.replaceState(null, '', startPath);
});

const mount = (initialLoad = false) => {
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
const last = () => done[done.length - 1];

describe('router — 이동 종류와 기록 항목 키', () => {
  it('새 이동은 push · 새 키, 뒤로 가기는 traverse · 그 항목의 키', async () => {
    const r = mount();
    await r.go('/a');
    const a = last();
    expect(a.type).toBe('push');
    expect(a.entryKey).toMatch(/\w/);
    await r.go('/b');
    expect(last()).toMatchObject({ type: 'push' });
    expect(last().entryKey).not.toBe(a.entryKey);
    history.back();
    await until(() => screenIn(root) === 'a', 'a');
    await until(() => last().type === 'traverse', 'traverse');
    expect(last().entryKey).toBe(a.entryKey);
  });

  it('교체(replace · 같은 주소)는 replace · 같은 칸의 키를 잇는다', async () => {
    const r = mount();
    await r.go('/a');
    const key = last().entryKey;
    await r.go('/a');
    expect(last()).toEqual({ type: 'replace', entryKey: key });
    await r.go('/b', { replace: true });
    expect(last()).toEqual({ type: 'replace', entryKey: key });
  });

  it('첫 로드는 문서가 열린 방식으로 — 이 시험 문서는 새 방문(push)', async () => {
    history.replaceState(null, '', startPath + '#/a');
    mount(true);
    await until(() => done.length > 0, 'route-done');
    expect(last().type).toBe('push');
  });

  it('u-link 는 popstate 를 내지 않는다 — 라우터에 이동을 요청하고 그것은 push 다', async () => {
    const r = mount();
    await r.go('/a');
    const link = document.createElement('u-link') as HTMLElement & { href: string };
    link.href = '/b';
    link.textContent = 'to b';
    // 라우터 루트 밖 — 셸의 사이드바처럼. 루트의 클릭 위임이 아니라 링크 자신의 경로를 잰다.
    // 여백 무대: 프레임 왼쪽 위 모서리의 작은 요소에는 러너의 누름이 닿지 않는다(chat-components 시험 실측).
    const stage = document.body.appendChild(document.createElement('div'));
    stage.style.padding = '48px';
    stage.appendChild(link);
    const before = history.length;
    await userEvent.click(link);
    await until(() => screenIn(root) === 'b', 'b');
    stage.remove();
    expect(popstates).toBe(0);
    expect(last().type).toBe('push');
    expect(history.length).toBe(before + 1);
    expect((history.state as Record<string, unknown>).mode).toBe('hash');
  });

  it('navigate() — 라우터 인스턴스 없이 이동을 요청한다(replace 도)', async () => {
    mount();
    navigate('/a');
    await until(() => screenIn(root) === 'a', 'a');
    expect(last().type).toBe('push');
    navigate('/b', { replace: true });
    await until(() => screenIn(root) === 'b', 'b');
    expect(last().type).toBe('replace');
    expect(popstates).toBe(0);
  });

  it('⚪NEGATIVE — 앱 상태가 라우터 필드 이름을 써도 모드·항목 키를 덮지 못한다', async () => {
    const r = mount();
    await r.go('/a', { state: { mode: 'history', entryKey: 'mine', tab: 2 } });
    const s = history.state as Record<string, unknown>;
    expect(s.mode).toBe('hash');
    expect(s.entryKey).toBe(last().entryKey);
    expect(s.tab).toBe(2);
  });
});

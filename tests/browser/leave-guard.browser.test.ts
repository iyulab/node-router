/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router, navigate, selection, type RouteLeaveContext } from '../../src/index.js';
import '../../src/components/UOutlet.js';

/**
 * **`leave` — 화면을 떠나기 전에 묻는다**(`enter` 의 대칭). 저장 안 한 입력을 가진 화면이 링크 · `go()` · `navigate()` ·
 * 선택 채널 · 뒤로·앞으로 가기에 말없이 사라지지 않게 한다. 막히면 화면도 주소도 그대로다.
 * 뒤로·앞으로 가기는 History API 에 «취소» 가 없어, 라우터가 먼저 원래 항목으로 되돌리고 묻는다 — 실브라우저에서만 잰다.
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
/** 일어나지 않아야 하는 것을 잴 때 — 이동이 끝날 만큼 기다린다. */
const quiet = async () => {
  for (let i = 0; i < 6; i++) await settle();
};

const startPath = window.location.pathname + window.location.search;
let root: HTMLElement;
let router: Router | undefined;
let dirty = false;
let asked: RouteLeaveContext[] = [];
let order: string[] = [];

const screen = () => root.querySelector('[data-screen]')?.getAttribute('data-screen');

beforeEach(() => {
  history.replaceState(null, '', startPath);
  dirty = false;
  asked = [];
  order = [];
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

const page = (name: string) => () => {
  const s = document.createElement('section');
  s.setAttribute('data-screen', name);
  return s;
};

const mount = (extra?: { leave?: (ctx: RouteLeaveContext) => boolean | Promise<boolean> }) => {
  router = new Router({
    root,
    mode: 'hash',
    initialLoad: false,
    leave: extra?.leave,
    routes: [
      { path: '/list', render: page('list') },
      { path: '/other', render: page('other') },
      { path: '/old', render: () => '/other' as unknown as HTMLElement, enter: () => '/other' },
      { path: '/slow', enter: async () => { await new Promise((r) => setTimeout(r, 300)); return true; }, render: page('slow') },
      {
        path: '/edit',
        key: () => 'edit',
        leave: (ctx) => {
          asked.push(ctx);
          order.push('route');
          return !dirty;
        },
        render: page('edit'),
      },
    ],
  });
  return router;
};

describe('leave — 링크 · go() · navigate()', () => {
  it('저장 안 한 화면에서 go() 는 취소된다 — 화면 · 주소 · 기록이 그대로다', async () => {
    const r = mount();
    await r.go('/edit');
    dirty = true;
    const before = history.length;
    await r.go('/list');
    expect(screen()).toBe('edit');
    expect(location.hash).toBe('#/edit');
    expect(history.length).toBe(before);
    expect(asked).toHaveLength(1);
    expect(asked[0].from.pathname).toBe('/edit');
    expect(asked[0].to.pathname).toBe('/list');
    expect(asked[0].to.navigation.type).toBe('push');
  });

  it('깨끗하면 묻고 통과한다', async () => {
    const r = mount();
    await r.go('/edit');
    await r.go('/list');
    expect(screen()).toBe('list');
    expect(asked).toHaveLength(1);
  });

  it('navigate() 와 같은 주소로의 이동 — navigate 는 묻고, 같은 주소는 화면을 떠나지 않으니 묻지 않는다', async () => {
    const r = mount();
    await r.go('/edit');
    dirty = true;
    navigate('/list');
    await quiet();
    expect(screen()).toBe('edit');
    expect(asked).toHaveLength(1);
    await r.go('/edit');
    expect(asked).toHaveLength(1);
  });

  it('a 링크 클릭(가로채기)도 막힌다', async () => {
    const r = mount();
    await r.go('/edit');
    dirty = true;
    const a = document.createElement('a');
    a.href = '#/list';
    a.textContent = 'list';
    root.appendChild(a);
    a.click();
    await quiet();
    expect(screen()).toBe('edit');
    expect(location.hash).toBe('#/edit');
  });

  it('라우트 가드(자식) 다음 글로벌 가드 — 라우트가 막으면 글로벌은 부르지 않는다', async () => {
    const r = mount({ leave: () => { order.push('global'); return true; } });
    await r.go('/edit');
    await r.go('/list');
    expect(order).toEqual(['route', 'global']);
    await r.go('/edit');
    order = [];
    dirty = true;
    await r.go('/other');
    expect(order).toEqual(['route']);
    expect(screen()).toBe('edit');
  });

  it('비동기 가드를 기다린다 · 던지면 취소로 본다', async () => {
    let answer!: (v: boolean) => void;
    const r = mount({ leave: () => new Promise<boolean>((resolve) => { answer = resolve; }) });
    await r.go('/list');
    const pending = r.go('/other');
    await settle();
    expect(screen()).toBe('list');
    answer(true);
    await pending;
    expect(screen()).toBe('other');

    router!.destroy();
    const r2 = mount({ leave: () => { throw new Error('boom'); } });
    await r2.go('/list');
    await r2.go('/other');
    expect(screen()).toBe('list');
  });

  it('리다이렉트 경유지에서는 묻지 않는다 — 처음 떠날 때 한 번', async () => {
    const r = mount();
    await r.go('/edit');
    await r.go('/old');
    expect(screen()).toBe('other');
    expect(asked).toHaveLength(1);
    expect(asked[0].to.pathname).toBe('/old');
  });
});

describe('leave — 뒤로 · 앞으로 가기', () => {
  it('Back 이 막히면 원래 항목에 머문다 — 깨끗해지면 같은 Back 이 간다', async () => {
    const r = mount();
    await r.go('/list');
    await r.go('/edit');
    dirty = true;
    history.back();
    await until(() => asked.length === 1, '가드가 물음');
    await quiet();
    expect(location.hash).toBe('#/edit');
    expect(screen()).toBe('edit');
    expect(asked[0].to.pathname).toBe('/list');
    expect(asked[0].to.navigation.type).toBe('traverse');

    dirty = false;
    history.back();
    await until(() => screen() === 'list', 'Back 뒤 목록');
    expect(location.hash).toBe('#/list');
    // 앞으로 가기는 돌아올 항목이 남아 있다(되돌림이 기록을 지우지 않았다).
    history.forward();
    await until(() => screen() === 'edit', 'Forward 뒤 편집');
  });

  it('여러 칸을 건너는 이동(go(-2))도 같은 칸으로 되돌리고 통과하면 같은 곳으로 간다', async () => {
    const r = mount();
    await r.go('/list');
    await r.go('/other');
    await r.go('/edit');
    dirty = true;
    history.go(-2);
    await until(() => asked.length === 1, '가드가 물음');
    await quiet();
    expect(location.hash).toBe('#/edit');
    expect(asked[0].to.pathname).toBe('/list');

    let release!: (v: boolean) => void;
    router!.destroy();
    const r2 = mount({ leave: () => new Promise<boolean>((resolve) => { release = resolve; }) });
    await r2.go('/edit');
    dirty = false;
    history.go(-2);
    await until(() => typeof release === 'function', '글로벌 가드가 물음');
    // 묻는 동안 주소는 떠나는 곳이 아니라 원래 항목이다.
    expect(location.hash).toBe('#/edit');
    release(true);
    await until(() => screen() === 'list', '통과 뒤 두 칸 전');
    expect(location.hash).toBe('#/list');
  });

  it('가드가 없으면 Back 을 되돌리지 않는다(종전 그대로)', async () => {
    const r = mount();
    await r.go('/list');
    await r.go('/other');
    history.back();
    await until(() => screen() === 'list', 'Back');
  });
});

describe('leave — 선택 채널', () => {
  it('라우터를 거치는 선택이 막히면 채널 값도 그대로다', async () => {
    const r = mount();
    await r.go('/edit');
    const c = selection<string>('t-leave', { query: 'pick' });
    const seen: Array<string | undefined> = [];
    c.subscribe((v) => seen.push(v));
    c.set('a');
    await until(() => c.value === 'a', '깨끗할 때 선택');
    dirty = true;
    c.set('b');
    await quiet();
    expect(c.value).toBe('a');
    expect(location.hash).toBe('#/edit?pick=a');
    expect(seen).toEqual(['a']);
  });

  it('물을 가드가 없는 화면에서는 종전처럼 set() 그 자리에서 값이 바뀐다', async () => {
    const r = mount();
    await r.go('/list');
    const c = selection<string>('t-leave-sync', { query: 'pick' });
    c.set('x');
    expect(c.value).toBe('x');
    await until(() => location.hash === '#/list?pick=x', '주소');
  });
});

describe('leave — 바로 답하는 가드는 기다리지 않는다', () => {
  it('바로 통과하는 가드면 기록은 go() 를 부른 그 틱에 쓰인다', () => {
    const r = mount({ leave: () => true });
    void r.go('/list');
    return (async () => {
      await until(() => screen() === 'list', '목록');
      void r.go('/other');
      expect(location.hash).toBe('#/other');
    })();
  });

  it('바로 통과하는 가드면 Back 을 되돌리지 않는다 — popstate 한 번', async () => {
    const r = mount({ leave: () => true });
    await r.go('/list');
    await r.go('/other');
    let pops = 0;
    const count = () => { pops++; };
    window.addEventListener('popstate', count);
    history.back();
    await until(() => screen() === 'list', 'Back');
    await quiet();
    window.removeEventListener('popstate', count);
    expect(pops).toBe(1);
  });

  it('바로 막힌 이동은 진행 중인 앞 이동을 끊지 않는다', async () => {
    const r = mount({ leave: (ctx) => ctx.to.pathname !== '/other' });
    await r.go('/list');
    const slow = r.go('/slow');
    await settle();
    await r.go('/other');
    await slow;
    expect(screen()).toBe('slow');
  });

  it('가드가 답하는 중인 선택은 답이 나온 뒤 바뀐다 — 통과면 값이 따라간다', async () => {
    let answer!: (v: boolean) => void;
    const r = mount({ leave: () => new Promise<boolean>((resolve) => { answer = resolve; }) });
    await r.go('/edit');
    const c = selection<string>('t-leave-pending', { query: 'pick' });
    c.set('p');
    await settle();
    expect(c.value).toBeUndefined();
    answer(true);
    await until(() => c.value === 'p', '통과 뒤 값');
    expect(location.hash).toBe('#/edit?pick=p');
  });
});

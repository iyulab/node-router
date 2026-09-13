// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { html } from 'lit';
import { createElement, useState } from 'react';
import { Router } from '../src/Router.js';
import type { RouteConfig } from '../src/types/RouteConfig.js';

/**
 * `RouteConfig.key` — «언제 새로 만드는가» 를 라우트가 소유한다 (docket #234).
 *
 * 종전에는 매 네비게이션마다 `u-outlet.reset()` 뒤 새로 마운트했고, 그래서 pathname 은 그대로고
 * 쿼리스트링만 바뀌어도(목록에서 상세 오버레이를 여는 형태) 페이지가 통째로 재마운트돼 목록
 * 상태·스크롤·적재 데이터가 사라졌다. 이제 같은 키면 같은 파트/root 에 다시 렌더해 조정한다.
 *
 * ★NEGATIVE 셋: 기본값(leaf 는 href) 은 종전과 같이 새로 마운트한다 · 부모 레이아웃은 자식이
 *   바뀌어도 유지된다(종전과 같다) · 콘텐츠 종류가 바뀌면 같은 키여도 새로 마운트한다.
 * ★회귀 하나: leaf 에 상수 키를 주면 «유지» 다 — 예전 `force: false` 가 표현하려던 값이고, 그 불리언은 0.13.0 에서 제거됐다.
 */

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

async function settle(router: Router, href: string) {
  await router.go(href);
  await tick();
  await tick();
}

describe('RouteConfig.key — 같은 키면 제자리 갱신', () => {
  let root: HTMLElement;
  let outlet: HTMLElement;
  let router: Router | undefined;

  beforeEach(() => {
    root = document.createElement('div');
    outlet = document.createElement('u-outlet');
    root.appendChild(outlet);
    document.body.appendChild(root);
    history.replaceState(null, '', '/');
  });

  afterEach(() => {
    router?.destroy();
    root.remove();
  });

  function make(routes: RouteConfig[]) {
    router = new Router({ root, basepath: '/', routes, initialLoad: false });
    return router;
  }

  it('key: ctx => ctx.pathname — 쿼리스트링만 바뀌면 요소가 유지되고 바인딩만 갱신된다', async () => {
    const r = make([
      {
        path: '/orders',
        key: (ctx) => ctx.pathname,
        render: (ctx) => html`<p class="orders" data-id=${ctx.query.get('id') ?? ''}>orders</p>`,
      },
    ]);
    await settle(r, '/orders');
    const first = outlet.querySelector('p.orders')!;
    expect(first).toBeTruthy();
    expect(first.getAttribute('data-id')).toBe('');

    await settle(r, '/orders?id=42');
    const second = outlet.querySelector('p.orders')!;
    expect(second).toBe(first); // 같은 요소 — 재마운트되지 않았다
    expect(second.getAttribute('data-id')).toBe('42'); // 그러나 새 ctx 는 도달했다

    await settle(r, '/orders'); // 뒤로가기와 같은 형태
    expect(outlet.querySelector('p.orders')).toBe(first);
    expect(first.getAttribute('data-id')).toBe('');
  });

  it('NEGATIVE: 기본 키(href)는 종전처럼 URL 이 바뀌면 새로 마운트한다', async () => {
    const r = make([
      { path: '/orders', render: (ctx) => html`<p class="orders" data-id=${ctx.query.get('id') ?? ''}>orders</p>` },
    ]);
    await settle(r, '/orders');
    const first = outlet.querySelector('p.orders')!;
    await settle(r, '/orders?id=42');
    const second = outlet.querySelector('p.orders')!;
    expect(second).not.toBe(first);
    expect(second.getAttribute('data-id')).toBe('42');
  });

  it('회귀: leaf 에 상수 key 를 주면 «유지» 다 (예전 force:false 의 자리)', async () => {
    const r = make([
      { path: '/orders', key: () => 'orders', render: (ctx) => html`<p class="orders" data-id=${ctx.query.get('id') ?? ''}>orders</p>` },
    ]);
    await settle(r, '/orders');
    const first = outlet.querySelector('p.orders')!;
    await settle(r, '/orders?id=7');
    expect(outlet.querySelector('p.orders')).toBe(first);
    expect(first.getAttribute('data-id')).toBe('7');
  });

  it('NEGATIVE: 자식을 가진 레이아웃은 자식이 바뀌어도 유지되고, 새 ctx 로 제자리 갱신된다', async () => {
    const r = make([
      {
        path: '/app',
        render: (ctx) => html`<nav class="layout" data-path=${ctx.pathname}>nav</nav><u-outlet></u-outlet>`,
        children: [
          { path: 'a', render: () => html`<p class="child">a</p>` },
          { path: 'b', render: () => html`<p class="child">b</p>` },
        ],
      },
    ]);
    await settle(r, '/app/a');
    const nav = outlet.querySelector('nav.layout')!;
    const inner = outlet.querySelector('u-outlet')!;
    expect(inner.querySelector('p.child')?.textContent).toBe('a');
    expect(nav.getAttribute('data-path')).toBe('/app/a');

    await settle(r, '/app/b');
    expect(outlet.querySelector('nav.layout')).toBe(nav); // 레이아웃 유지
    expect(outlet.querySelector('u-outlet')).toBe(inner); // 내부 아웃렛 유지
    expect(inner.querySelector('p.child')?.textContent).toBe('b'); // 자식은 새로
    expect(nav.getAttribute('data-path')).toBe('/app/b'); // 종전에는 결과를 버려 갱신되지 않았다
  });

  it('HTMLElement 콘텐츠는 같은 키에서 기존 인스턴스를 유지한다', async () => {
    let created = 0;
    const r = make([
      {
        path: '/el',
        key: (ctx) => ctx.pathname,
        render: () => {
          created++;
          const el = document.createElement('section');
          el.className = 'el';
          return el;
        },
      },
    ]);
    await settle(r, '/el');
    const first = outlet.querySelector('section.el')!;
    await settle(r, '/el?x=1');
    expect(outlet.querySelector('section.el')).toBe(first);
    expect(created).toBe(2); // render 는 불렸지만 결과는 버려졌다
  });

  it('NEGATIVE: 같은 키여도 콘텐츠 종류가 바뀌면 새로 마운트한다', async () => {
    const r = make([
      {
        path: '/mixed',
        key: (ctx) => ctx.pathname,
        render: (ctx) =>
          ctx.query.has('el')
            ? Object.assign(document.createElement('section'), { className: 'mixed' })
            : html`<p class="mixed">lit</p>`,
      },
    ]);
    await settle(r, '/mixed');
    expect(outlet.querySelector('p.mixed')).toBeTruthy();
    await settle(r, '/mixed?el');
    expect(outlet.querySelector('p.mixed')).toBeNull();
    expect(outlet.querySelector('section.mixed')).toBeTruthy();
  });

  it('React 엘리먼트는 같은 root 에 다시 렌더돼 컴포넌트 상태가 살아남는다', async () => {
    function Page({ id }: { id: string }) {
      const [clicks, setClicks] = useState(0);
      return createElement(
        'button',
        { className: 'react', 'data-id': id, 'data-clicks': String(clicks), onClick: () => setClicks((c) => c + 1) },
        'page',
      );
    }
    const r = make([
      { path: '/react', key: (ctx) => ctx.pathname, render: (ctx) => createElement(Page, { id: ctx.query.get('id') ?? '' }) },
    ]);
    await settle(r, '/react');
    await tick();
    const btn = outlet.querySelector('button.react') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    await tick();
    expect(btn.getAttribute('data-clicks')).toBe('1');

    await settle(r, '/react?id=9');
    await tick();
    const after = outlet.querySelector('button.react') as HTMLButtonElement;
    expect(after).toBe(btn);
    expect(after.getAttribute('data-id')).toBe('9'); // 새 prop 도달
    expect(after.getAttribute('data-clicks')).toBe('1'); // 상태 유지
  });
});

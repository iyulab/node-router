// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../src/Router.js';
import { NotFoundError, RouteError } from '../src/types/RouteError.js';
import type { FallbackRouteConfig, RouteConfig } from '../src/types/RouteConfig.js';

/**
 * **fallback 의 제목은 실패를 따를 수 있고, 라우트는 자기 실패를 고를 수 있다.**
 *
 * | 계약 | 재는 것 |
 * |---|---|
 * | `title` 함수 | 실패마다 그 컨텍스트로 불려 `document.title` 이 된다(404 와 403 이 다른 제목) |
 * | `title` 문자열 · 없음 | 종전 그대로 — 문자열은 모든 실패에, 없으면 오류 메시지 |
 * | `render()` 가 던진 `RouteError` | 그대로 fallback 에 닿는다(`NotFoundError` → 코드 404) |
 * | 그 밖의 throw | `ContentLoadError` 로 감싸진다(`original` 이 던진 것) |
 *
 * 종전에는 제목이 고정 문자열뿐이라 기본 실패 화면이 탭에 «Page not found: http://…/x» 같은 진단 문구를 냈고,
 * `render()` 안의 `throw new NotFoundError()` 가 CONTENT_LOAD_FAILED 로 바뀌어 «레코드 없음» 을 404 로 그릴 수 없었다.
 */
describe('fallback title · route-chosen errors', () => {
  let root: HTMLElement;
  let router: Router | undefined;
  let seen: RouteError[];

  beforeEach(() => {
    root = document.createElement('div');
    root.appendChild(document.createElement('u-outlet'));
    document.body.appendChild(root);
    history.replaceState(null, '', '/');
    document.title = 'start';
    seen = [];
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    router?.destroy();
    root.remove();
    vi.restoreAllMocks();
  });

  const routes: RouteConfig[] = [
    { path: '/admin', enter: () => false, render: () => document.createElement('section') },
    { path: '/orders/:id', render: (ctx) => { throw new NotFoundError(ctx.pathname); } },
    { path: '/broken', render: () => { throw new Error('boom'); } },
  ];

  function make(fallback: Partial<FallbackRouteConfig>) {
    router = new Router({
      root,
      basepath: '/',
      initialLoad: false,
      routes,
      fallback: { render: (ctx) => { seen.push(ctx.error); return document.createElement('p'); }, ...fallback },
    });
    return router;
  }

  it('a title function is called per failure with that failure', async () => {
    const r = make({ title: (ctx) => (ctx.error.code === 404 ? 'Not here' : `Failed ${ctx.error.code}`) });
    await r.go('/nowhere');
    expect(document.title).toBe('Not here');
    await r.go('/admin');
    expect(document.title).toBe('Failed 403');
  });

  it('a title function that returns nothing falls back to the error message', async () => {
    const r = make({ title: () => undefined });
    await r.go('/nowhere');
    expect(document.title).toContain('Page not found');
  });

  it('a string title is used for every failure (unchanged)', async () => {
    const r = make({ title: 'Oops' });
    await r.go('/nowhere');
    expect(document.title).toBe('Oops');
    await r.go('/admin');
    expect(document.title).toBe('Oops');
  });

  it('no title → the error message (unchanged)', async () => {
    const r = make({});
    await r.go('/admin');
    expect(document.title).toContain('Access denied');
  });

  it('after a failure, a route without a title restores the title from before the failure', async () => {
    // 제목 없는 라우트는 문서 제목을 그대로 둔다 — 그래서 실패 제목이 회복 뒤에도 남았다.
    const r = new Router({
      root, basepath: '/', initialLoad: false,
      routes: [{ path: '/home', render: () => document.createElement('section') }],
      fallback: { title: 'Not here', render: () => document.createElement('p') },
    });
    router = r;
    document.title = 'My App';
    await r.go('/home');
    await r.go('/nowhere');
    await r.go('/still-nowhere');
    expect(document.title).toBe('Not here');
    await r.go('/home');
    expect(document.title).toBe('My App');
  });

  it('a route with its own title keeps it after a failure', async () => {
    const r = new Router({
      root, basepath: '/', initialLoad: false,
      routes: [{ path: '/home', title: 'Home', render: () => document.createElement('section') }],
      fallback: { title: 'Not here', render: () => document.createElement('p') },
    });
    router = r;
    document.title = 'My App';
    await r.go('/nowhere');
    await r.go('/home');
    expect(document.title).toBe('Home');
  });

  it('a RouteError thrown from render() reaches the fallback unchanged', async () => {
    const r = make({});
    await r.go('/orders/7');
    expect(seen[0]).toBeInstanceOf(NotFoundError);
    expect(seen[0].code).toBe(404);
  });

  it('anything else thrown from render() is a ContentLoadError carrying the original', async () => {
    const r = make({});
    await r.go('/broken');
    expect(seen[0].code).toBe('CONTENT_LOAD_FAILED');
    expect((seen[0].original as Error).message).toBe('boom');
  });
});

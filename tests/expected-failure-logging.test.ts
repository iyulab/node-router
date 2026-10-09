// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../src/Router.js';
import { NotFoundError } from '../src/types/RouteError.js';
import type { RouteErrorEvent } from '../src/types/RouteEvent.js';
import type { RouteConfig } from '../src/types/RouteConfig.js';

/**
 * **예상된 결과는 오류로 로깅하지 않는다 — 예상 밖 실패만 콘솔에 남는다.**
 *
 * | 실패 | `console.error` | `route-error` |
 * |---|---|---|
 * | 없는 경로(404) · 가드 거부(403) · 라우트가 고른 «레코드 없음»(404) · 가드가 던진 `{ status: 401 }` | 없음 | 난다 |
 * | 로드 · 렌더 실패(`render()` 가 던진 `Error`) | `Routing error:` + 원인 | 난다 |
 *
 * 종전에는 모든 실패가 `console.error` 였다 — fallback 이 정상 화면(«권한 없음» · «없는 페이지»)을 그린 뒤에도. 콘솔 오류를
 * 수집하는 모니터링이 권한 없는 이동마다 «장애» 를 받았다(참조 앱 실측).
 */
describe('Router — 예상된 실패의 로깅', () => {
  let root: HTMLElement;
  let router: Router | undefined;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let events: RouteErrorEvent[];
  const onError = (e: Event) => events.push(e as RouteErrorEvent);

  beforeEach(() => {
    root = document.createElement('div');
    root.appendChild(document.createElement('u-outlet'));
    document.body.appendChild(root);
    history.replaceState(null, '', '/');
    events = [];
    window.addEventListener('route-error', onError);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    router?.destroy();
    root.remove();
    window.removeEventListener('route-error', onError);
    vi.restoreAllMocks();
  });

  const routes: RouteConfig[] = [
    { path: '/admin', enter: () => false, render: () => document.createElement('section') },
    { path: '/session', enter: () => { throw { status: 401, message: 'Sign in first' }; }, render: () => document.createElement('section') },
    { path: '/orders/:id', render: (ctx) => { throw new NotFoundError(ctx.pathname); } },
    { path: '/broken', render: () => { throw new Error('boom'); } },
  ];

  function make() {
    router = new Router({ root, basepath: '/', initialLoad: false, routes, fallback: { render: () => document.createElement('p') } });
    return router;
  }

  const routingErrors = () => errorSpy.mock.calls.filter((c: unknown[]) => String(c[0]).startsWith('Routing error'));

  it.each(['/nowhere', '/admin', '/orders/7', '/session'])('%s — fallback 이 그리고, 콘솔 오류는 없다', async (path) => {
    await make().go(path);
    expect(events).toHaveLength(1);
    expect(Number(events[0].error.code)).toBeGreaterThanOrEqual(400);
    expect(routingErrors()).toHaveLength(0);
  });

  it('예상 밖 실패는 원인과 함께 콘솔 오류로 남는다', async () => {
    await make().go('/broken');
    expect(events).toHaveLength(1);
    const calls = routingErrors();
    expect(calls).toHaveLength(1);
    expect((calls[0][1] as Error).message).toBe('boom');
  });
});

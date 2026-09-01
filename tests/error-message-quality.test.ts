// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import '../src/components/UOutlet.js';
import type { UOutlet } from '../src/components/UOutlet.js';
import { getRoutes } from '../src/internals/route-helpers.js';
import type { RouteConfig } from '../src/types/RouteConfig.js';
import { Router } from '../src/Router.js';
import type { RouteErrorEvent } from '../src/types/RouteEvent.js';

/**
 * `ISSUE-router-20260901-generic-error-messages.md` — 세 오류 메시지가 원인 값·기대
 * 형식을 알려주는지 고정한다. 로직 변경 없이 메시지 문자열만 바뀐 수정이라, 이 테스트는
 * "던지는지"가 아니라 "던지는 메시지가 유용한지"를 잰다.
 */
describe('오류 메시지 정직성 — 실제 값·기대 형식을 포함한다', () => {
  it('UOutlet.render()가 지원하지 않는 값을 받으면 받은 타입 이름과 기대 타입 목록을 낸다', async () => {
    const el = document.createElement('u-outlet') as UOutlet;
    document.body.appendChild(el);

    await expect(el.render({ foo: 'bar' })).rejects.toThrow(
      /Unsupported content type for Outlet rendering: received Object.*Expected an HTMLElement, a Lit TemplateResult, or a React element/s,
    );

    el.remove();
  });

  it('getRoutes()가 URLPattern이 아닌 path를 만나면 실제 값과 정상 경로(Router 생성자)를 안내한다', () => {
    const routes: RouteConfig[] = [
      // 의도적으로 setRoutes()를 거치지 않은 원시 문자열 path — getRoutes()를 직접
      // 호출하는 오용을 재현한다.
      { path: '/home' as unknown as RouteConfig['path'], render: () => document.createElement('div') },
    ];

    expect(() => getRoutes(routes, '/home')).toThrow(
      /Route "path" must be a URLPattern, but got "\/home".*new Router\(\{ routes: \[\.\.\.\] \}\)/s,
    );
  });

  describe('Router — render()가 렌더 불가 값을 반환하면 라우트 경로/id를 포함한 오류를 낸다', () => {
    let root: HTMLElement;
    let router: Router | undefined;

    afterEach(() => {
      router?.destroy();
      root.remove();
    });

    it('render()가 null을 반환하면 RouteErrorEvent.error.original.message에 경로와 route id가 담긴다', async () => {
      root = document.createElement('div');
      root.appendChild(document.createElement('u-outlet'));
      document.body.appendChild(root);

      const errorEvent = new Promise<RouteErrorEvent>((resolve) => {
        window.addEventListener('route-error', (e) => resolve(e as RouteErrorEvent), { once: true });
      });

      router = new Router({
        root,
        basepath: '/',
        initialLoad: false,
        routes: [{ id: 'broken-page', path: '/broken', render: () => null }],
      });
      await router.go('/broken');

      const event = await errorEvent;
      expect(event.error.original?.message).toMatch(/"\/broken"/);
      expect(event.error.original?.message).toMatch(/route id: "broken-page"/);
    });
  });
});

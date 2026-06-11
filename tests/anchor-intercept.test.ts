// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router } from '../src/Router.js';

/**
 * 앵커 클릭 가로채기(handleRootElementClick) 동작 검증.
 *
 * 배경: basepath가 '/'인 앱에서 라우터가 모든 동일 출처 앵커를 가로채
 * 등록되지 않은 경로(예: 다른 앱의 경로)도 soft-404로 렌더하는 문제.
 * 기대 동작: 등록된 라우트에 매칭되지 않는 앵커는 가로채지 않고
 * 네이티브 내비게이션에 맡긴다 (passthrough).
 */

function createRoot(): HTMLElement {
  const root = document.createElement('div');
  root.appendChild(document.createElement('u-outlet'));
  document.body.appendChild(root);
  return root;
}

function clickAnchor(root: HTMLElement, href: string): MouseEvent {
  const anchor = document.createElement('a');
  anchor.setAttribute('href', href);
  root.appendChild(anchor);

  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  anchor.dispatchEvent(event);
  return event;
}

describe('handleRootElementClick — 라우트 매칭 기반 가로채기', () => {
  let root: HTMLElement;
  let router: Router | undefined;

  beforeEach(() => {
    root = createRoot();
  });

  afterEach(() => {
    router?.destroy();
    root.remove();
  });

  describe("basepath '/'", () => {
    beforeEach(() => {
      router = new Router({
        root,
        basepath: '/',
        initialLoad: false,
        routes: [
          { path: '/home', render: () => document.createElement('section') },
          { path: '/user/:id', render: () => document.createElement('section') },
        ],
      });
    });

    it('등록된 라우트에 매칭되는 앵커는 가로챈다', () => {
      const event = clickAnchor(root, '/home');
      expect(event.defaultPrevented).toBe(true);
    });

    it('파라미터 라우트에 매칭되는 앵커도 가로챈다', () => {
      const event = clickAnchor(root, '/user/42');
      expect(event.defaultPrevented).toBe(true);
    });

    it('등록되지 않은 경로의 앵커는 가로채지 않는다 (네이티브 내비게이션 passthrough)', () => {
      const event = clickAnchor(root, '/quality');
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("basepath '/app'", () => {
    beforeEach(() => {
      router = new Router({
        root,
        basepath: '/app',
        initialLoad: false,
        routes: [
          { path: '/home', render: () => document.createElement('section') },
        ],
      });
    });

    it('basepath 밖 앵커는 가로채지 않는다 (기존 동작 보존)', () => {
      const event = clickAnchor(root, '/other/page');
      expect(event.defaultPrevented).toBe(false);
    });

    it('basepath 안이지만 라우트에 매칭되지 않는 앵커는 가로채지 않는다', () => {
      const event = clickAnchor(root, '/app/unknown');
      expect(event.defaultPrevented).toBe(false);
    });

    it('basepath 안의 매칭되는 앵커는 가로챈다', () => {
      const event = clickAnchor(root, '/app/home');
      expect(event.defaultPrevented).toBe(true);
    });
  });
});

// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router } from '../src/Router.js';
import '../src/components/ULink.js';
import { basepathRoot, parseUrl } from '../src/internals/url-helpers.js';

/**
 * 하위 경로에 배포된 앱의 «루트» URL 은 끝 `/` 를 가진다.
 *
 * `absolutePath` 가 끝 `/` 를 지워, basepath 루트로 가는 세 경로(href 없는 `u-link` 의 표시 주소 · 그 클릭 ·
 * `go('')`)가 `/app` 을 냈다. Vite(`base: '/app/'`)는 `/app` 을 404 로 낸다 — 로고 링크를 새 탭으로 열거나,
 * 로고를 누른 뒤 새로 고치면 앱이 아니라 오류 화면이었다(배포 샘플에서 실브라우저로 확인).
 */

function createRoot(): HTMLElement {
  const root = document.createElement('div');
  root.appendChild(document.createElement('u-outlet'));
  document.body.appendChild(root);
  return root;
}

describe('basepath 루트 URL', () => {
  let root: HTMLElement;
  let router: Router | undefined;

  beforeEach(() => {
    window.history.replaceState(null, '', '/app/items');
    root = createRoot();
    router = new Router({
      root,
      basepath: '/app/',
      initialLoad: false,
      routes: [
        { index: true, render: () => document.createElement('section') },
        { path: 'items', render: () => document.createElement('article') },
      ],
    });
  });

  afterEach(() => {
    router?.destroy();
    root.remove();
  });

  it('🔴href 없는 `u-link` 의 앵커는 `/app/` 을 가리킨다 — 새 탭·주소 복사가 앱으로 열린다', () => {
    const logo = document.createElement('u-link');
    document.body.appendChild(logo);
    const anchor = logo.shadowRoot!.querySelector('a')!;
    expect(new URL(anchor.getAttribute('href')!).pathname).toBe('/app/');
    logo.remove();
  });

  it('🔴href 없는 `u-link` 를 누르면 주소창이 `/app/` 이 된다 — 새로 고쳐도 앱이다', () => {
    const logo = document.createElement('u-link');
    document.body.appendChild(logo);
    logo.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    expect(window.location.pathname).toBe('/app/');
    logo.remove();
  });

  it("🔴`go('')` 도 `/app/` 으로 간다", async () => {
    await router!.go('');
    expect(window.location.pathname).toBe('/app/');
  });

  it('NEGATIVE 루트가 아닌 상대 경로는 종전대로 끝 `/` 없이 결합된다', () => {
    expect(parseUrl('items', '/app', new URL('http://localhost/app/')).pathname).toBe('/app/items');
  });

  it('NEGATIVE basepath 가 `/` 면 `/` 그대로다(`//` 가 되지 않는다)', () => {
    expect(basepathRoot('/')).toBe('/');
    expect(basepathRoot('')).toBe('/');
    expect(basepathRoot('/app')).toBe('/app/');
    expect(basepathRoot('/app/')).toBe('/app/');
  });
});

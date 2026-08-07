// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router } from '../src/Router.js';
import '../src/components/ULink.js';

/**
 * 같은 오리진의 **SPA 라우트가 아닌 경로**로 이동할 수 있는가.
 *
 * ## 왜 이 파일이 생겼는가
 *
 * 「이 링크가 외부인가」를 **오리진 비교 하나**로만 판정했다. 그래서 같은 오리진에 있으나
 * SPA 라우트가 아닌 경로(정적 문서 사이트, 서버 렌더 페이지, 다운로드 엔드포인트, 인증
 * 리다이렉트)를 가리킬 수단이 없었다 — 라우터가 클릭을 가로채고, 등록되지 않은 라우트이므로
 * 화면이 not-found 로 떨어졌다.
 *
 * 빠져나갈 길이 셋뿐이었고 **셋 다 요구와 다르다**:
 * 다른 오리진(같은 오리진이어야 한다 — 쿠키·세션·역방향 프록시) · `target="_blank"`(**새 탭
 * 강제**, 같은 탭 이동을 표현할 수 없다) · `#`(프래그먼트일 뿐 다른 문서가 아니다).
 *
 * ⇒ `navigate="document"` 로 **선언**한다. 이름이 `external` 이 아닌 이유: 이 모듈에는
 * `isExternalUrl`/`isExternal` 이 **이미 오리진 의미로** 박혀 있어, 같은 이름이 다른 것을
 * 뜻하면 읽는 사람이 매번 어느 쪽인지 되짚어야 한다. 재는 것은 오리진이 아니라 **문서**다.
 *
 * ## 두 경로가 있고 «둘 다» 존중해야 한다
 *
 * `ULink` 자신의 핸들러와 `Router` 의 전역 앵커 위임은 **서로 다른 규칙**을 쓰고 있었다 —
 * 후자는 「등록된 라우트가 없으면 통과」를 이미 하는데 전자는 하지 않는다. ULink 만 고치면
 * **등록된 라우트를 가리키는 경우** 전역 위임이 뒤이어 가로챈다.
 */

function createRoot(): HTMLElement {
  const root = document.createElement('div');
  root.appendChild(document.createElement('u-outlet'));
  document.body.appendChild(root);
  return root;
}

function clickAnchor(root: HTMLElement, href: string, attrs: Record<string, string> = {}): MouseEvent {
  const anchor = document.createElement('a');
  anchor.setAttribute('href', href);
  for (const [k, v] of Object.entries(attrs)) anchor.setAttribute(k, v);
  root.appendChild(anchor);
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  anchor.dispatchEvent(event);
  return event;
}

async function clickLink(props: Record<string, string>): Promise<MouseEvent> {
  const link = document.createElement('u-link') as HTMLElement & { updateComplete: Promise<boolean> };
  for (const [k, v] of Object.entries(props)) link.setAttribute(k, v);
  document.body.appendChild(link);
  await link.updateComplete;
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  link.dispatchEvent(event);
  link.remove();
  return event;
}

describe('같은 오리진의 비-SPA 경로', () => {
  let root: HTMLElement;
  let router: Router | undefined;

  beforeEach(() => {
    root = createRoot();
    router = new Router({
      root,
      basepath: '/',
      initialLoad: false,
      routes: [{ path: '/home', render: () => document.createElement('section') }],
    });
  });

  afterEach(() => {
    router?.destroy();
    root.remove();
  });

  describe('ULink 핸들러', () => {
    it('🔴navigate="document" 면 가로채지 않는다 — 같은 오리진이어도', async () => {
      const event = await clickLink({ href: '/help/', navigate: 'document' });
      expect(event.defaultPrevented).toBe(false);
    });

    it('NEGATIVE: 선언이 없으면 종전대로 SPA 이동이다', async () => {
      const event = await clickLink({ href: '/home' });
      expect(event.defaultPrevented).toBe(true);
    });

    it('NEGATIVE: navigate="router" 를 명시해도 종전 동작이다 (기본값과 같다)', async () => {
      const event = await clickLink({ href: '/home', navigate: 'router' });
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('Router 전역 앵커 위임', () => {
    it('🔴data-navigate="document" 인 앵커는 «등록된 라우트여도» 가로채지 않는다', () => {
      // ULink 만 고치면 이 경우가 남는다 — 전역 위임이 뒤이어 받는다.
      const event = clickAnchor(root, '/home', { 'data-navigate': 'document' });
      expect(event.defaultPrevented).toBe(false);
    });

    it('NEGATIVE: 표시가 없으면 등록된 라우트는 종전대로 가로챈다', () => {
      const event = clickAnchor(root, '/home');
      expect(event.defaultPrevented).toBe(true);
    });

    it('NEGATIVE: 미등록 경로는 선언 없이도 통과한다 (선존 동작을 바꾸지 않았다)', () => {
      const event = clickAnchor(root, '/help/');
      expect(event.defaultPrevented).toBe(false);
    });
  });

  it('ULink 가 렌더한 앵커에 표시가 실린다 — 두 경로가 같은 신호를 본다', async () => {
    const link = document.createElement('u-link') as HTMLElement & {
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    link.setAttribute('href', '/help/');
    link.setAttribute('navigate', 'document');
    document.body.appendChild(link);
    await link.updateComplete;

    const anchor = link.shadowRoot!.querySelector('a')!;
    expect(anchor.getAttribute('data-navigate')).toBe('document');
    link.remove();
  });
});

// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * ISSUE-20260722-router-react-consumption #1 (정정): root 안에 <u-outlet> 이 없을 때
 * waitOutlet 은 (초안 작성 시점부터 이미) 서술적 Error 로 reject 한다. 그러나 Router 는
 * `void waitOutlet(...).then(...)` 로 거부를 삼켜, 폴링 타임아웃만큼 지연된 뒤 unhandled
 * rejection 으로만 새어 나갔다 — 소비자에겐 사실상 원인 없는 빈 화면이었다.
 * 수정: `.catch()` 로 console.error 에 명시적으로 표면화한다. 이 테스트는 그 배선을 고정한다.
 *
 * waitOutlet 을 즉시 reject 하도록 mock 해 10초 폴링을 건너뛴다.
 */
vi.mock('../src/internals/element-helpers.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/internals/element-helpers.js')>();
  return {
    ...actual,
    waitOutlet: vi.fn().mockRejectedValue(
      new Error('Timed out waiting for <u-outlet> inside <div>.'),
    ),
  };
});

import { Router } from '../src/Router.js';

describe('Router — <u-outlet> 부재 시 오류 표면화', () => {
  let root: HTMLElement;
  let router: Router | undefined;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    root = document.createElement('div'); // 의도적으로 <u-outlet> 없음
    document.body.appendChild(root);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    router?.destroy();
    root.remove();
    errorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('outlet 부재 거부를 삼키지 않고 console.error 로 표면화한다', async () => {
    router = new Router({ root, routes: [] });
    // .catch() 마이크로태스크가 흐르도록 대기
    await new Promise((r) => setTimeout(r, 0));

    expect(errorSpy).toHaveBeenCalled();
    const firstArg = errorSpy.mock.calls[0]?.[0];
    expect(String(firstArg)).toContain('Router initialization failed');
  });
});

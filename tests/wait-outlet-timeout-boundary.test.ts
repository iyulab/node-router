// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitOutlet } from '../src/internals/element-helpers.js';

/**
 * §D-32 / ISSUE-router-20260811-waitoutlet-no-final-check-before-throw:
 *
 * `waitOutlet`의 while 루프는 `performance.now()` 재평가를 `requestAnimationFrame`
 * 콜백이 리졸브된 뒤에만 하므로, 완전히 suspend된(백그라운드) 탭에서는 rAF가 영원히
 * 발화하지 않아 루프 자체를 빠져나오지 못했다(아래 첫 테스트). 그리고 설령 (setTimeout
 * 경합으로) 루프를 빠져나오더라도, 원래 코드는 최종 재확인 없이 곧장 throw해 타임아웃
 * 판정 직전 프레임에 이미 준비된 아웃렛을 오탐(false timeout)으로 놓쳤다(아래 두 번째
 * 테스트).
 */
describe('waitOutlet — 타임아웃 경계 조건', () => {
  let root: HTMLElement;
  let rafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    vi.useFakeTimers();
    // 완전히 suspend된 탭 시뮬레이션 — rAF 콜백을 영원히 호출하지 않는다.
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0 as unknown as number);
  });

  afterEach(() => {
    rafSpy.mockRestore();
    vi.useRealTimers();
    root.remove();
  });

  it('rAF가 발화하지 않아도 setTimeout 경합 덕분에 timeout 내에 정착한다(무한 대기하지 않는다)', async () => {
    const promise = waitOutlet(root, 1000); // root에는 의도적으로 outlet 없음
    const settled = vi.fn();
    promise.catch(settled);

    await vi.advanceTimersByTimeAsync(1500);

    expect(settled).toHaveBeenCalled();
    await expect(promise).rejects.toThrow(/Timed out waiting for <u-outlet>/);
  });

  it('타임아웃 판정 직전 프레임에 아웃렛이 준비되면 마지막 재확인이 그것을 잡는다(오탐 방지)', async () => {
    const promise = waitOutlet(root, 1000);

    // 타임아웃 경계 바로 앞까지 진행 — 아직 outlet 없음.
    await vi.advanceTimersByTimeAsync(999);

    // 타임아웃 판정 직전 프레임에 실제로 outlet이 부착됐다고 가정한다.
    const outlet = document.createElement('u-outlet');
    root.appendChild(outlet);

    // 남은 시간을 넘겨 setTimeout 경합 분기가 이기게 한다(deadline 통과).
    await vi.advanceTimersByTimeAsync(50);

    await expect(promise).resolves.toBe(outlet);
  });
});

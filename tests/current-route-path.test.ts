// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { currentRoutePath } from '../src/index.js';

/**
 * `currentRoutePath()` — 라우터 인스턴스 없이 지금의 라우트 경로를 읽는다(`RouteContext.path` 와 같은 형식).
 *
 * 계기: 라우트 결과물로 그려지는 셸(사이드바)은 첫 `route-begin` 이 자기가 붙기 **전에** 지나가, 주소창 진입·새로 고침
 * 직후 현재 메뉴를 몰랐다. 모드는 라우터가 히스토리 상태에 적은 것을 따른다 — `u-link` 와 같은 통로.
 */
describe('currentRoutePath', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('history 모드(상태 없음 포함) — 경로 + 쿼리 + 해시', () => {
    window.history.replaceState(null, '', '/assets/7?tab=log#top');
    expect(currentRoutePath()).toBe('/assets/7?tab=log#top');
    window.history.replaceState({ mode: 'history', basepath: '/' }, '', '/work-orders');
    expect(currentRoutePath()).toBe('/work-orders');
  });

  it('hash 모드 — # 뒤가 라우트다', () => {
    window.history.replaceState({ mode: 'hash', basepath: '/' }, '', '/app/#/orders/7?x=1');
    expect(currentRoutePath()).toBe('/orders/7?x=1');
  });

  it('hash 모드 · 조각이 비었으면 루트', () => {
    window.history.replaceState({ mode: 'hash', basepath: '/' }, '', '/app/');
    expect(currentRoutePath()).toBe('/');
  });
});

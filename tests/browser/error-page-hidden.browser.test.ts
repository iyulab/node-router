/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/components/UErrorPage.js';

/**
 * **`hidden` 은 `u-error-page` 를 숨긴다.** 호스트의 `display: flex` 가 브라우저의 `[hidden] { display: none }` 을 이겨,
 * 숨긴 오류 화면이 그대로 그려졌다(섀도의 `:host` 규칙은 바깥 UA 규칙보다 앞선다).
 */
afterEach(() => { document.body.replaceChildren(); });

describe('u-error-page hidden', () => {
  it('숨기면 상자가 없다', () => {
    const el = document.createElement('u-error-page');
    document.body.append(el);
    expect(getComputedStyle(el).display).toBe('flex');
    el.hidden = true;
    expect(getComputedStyle(el).display).toBe('none');
  });
});

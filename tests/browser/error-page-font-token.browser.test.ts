/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/components/UErrorPage.js';

/**
 * **`u-error-page` 의 글꼴은 글자 토큰(`--u-font-base`)을 따른다.** 리터럴 묶음이라 테마를 입힌 앱에서 오류 화면만 다른
 * 글꼴이었다. 라우터는 components 를 의존하지 않으므로 토큰이 없으면 종전 묶음이 폴백이다.
 */
let theme: HTMLStyleElement | null = null;
afterEach(() => {
  document.body.replaceChildren();
  theme?.remove();
  theme = null;
});

describe('u-error-page 글꼴', () => {
  it('--u-font-base 를 따른다', () => {
    theme = document.createElement('style');
    theme.textContent = ':root { --u-font-base: Georgia, serif; }';
    document.head.append(theme);
    const el = document.createElement('u-error-page');
    document.body.append(el);
    expect(getComputedStyle(el).fontFamily).toMatch(/^Georgia/);
  });

  it('NEGATIVE — 토큰이 없으면 종전 묶음', () => {
    const el = document.createElement('u-error-page');
    document.body.append(el);
    expect(getComputedStyle(el).fontFamily).toMatch(/^-apple-system/);
  });
});

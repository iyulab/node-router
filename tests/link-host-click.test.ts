// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import '../src/components/ULink.js';

/**
 * `u-link` hears clicks on its shadow root, not on its host: a click listener on the host had screen readers read
 * the link inside as «clickable, link». The host is presentational (`role="none"`) so an author's own listener on
 * it stays quiet too, and `click()` on the host presses the inner link.
 */
afterEach(() => { document.body.innerHTML = ''; });

describe('u-link — clicks heard off the host', () => {
  it('the host is presentational; an author role wins', () => {
    document.body.innerHTML = '<u-link id="a" href="/x">A</u-link><u-link id="b" role="menuitem" href="/y">B</u-link>';
    expect(document.getElementById('a')!.getAttribute('role')).toBe('none');
    expect(document.getElementById('b')!.getAttribute('role')).toBe('menuitem');
  });

  it('click() on the host presses the inner link', () => {
    document.body.innerHTML = '<u-link href="#here">A</u-link>';
    const link = document.querySelector('u-link')!;
    const anchor = link.shadowRoot!.querySelector('a')!;
    let pressed = 0;
    anchor.addEventListener('click', (e) => { pressed++; e.preventDefault(); });
    (link as HTMLElement).click();
    expect(pressed).toBe(1);
  });
});

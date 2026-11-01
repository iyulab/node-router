/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach, vi } from 'vitest';
import { Router, selection } from '../../src/index.js';
import '../../src/components/UOutlet.js';

/**
 * **A history update the browser refuses does not throw into the app.**
 *
 * Safari throws `SecurityError` on more than 100 `replaceState` / `pushState` calls in 10 seconds (Chromium drops the
 * extra calls silently, so a Chromium run never sees it). A selection bound to the address changes on every arrow key
 * — holding the key reaches the limit within seconds, and the exception broke the selection change and the navigation
 * mid-way. Now the refused write is skipped: the channel value and the screen move on, the address catches up on the
 * next write, and the console says so once. Any other error still throws.
 *
 * The refusal is simulated here so the contract holds in every engine.
 */
const startPath = window.location.pathname + window.location.search;
const refusal = () => new DOMException('Attempt to use history.replaceState() more than 100 times per 10 seconds', 'SecurityError');
let router: Router | undefined;

afterEach(() => {
  vi.restoreAllMocks();
  router?.destroy();
  router = undefined;
  document.body.replaceChildren();
  history.replaceState(null, '', startPath);
});

describe('history writes the browser refuses', () => {
  it('a selection with no router changes its value and does not throw', () => {
    const channel = selection<string>('refused-no-router', { query: 'refused-a' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(history, 'replaceState').mockImplementation(() => { throw refusal(); });
    const heard: (string | undefined)[] = [];
    channel.subscribe((v) => heard.push(v));
    expect(() => channel.set('G-1')).not.toThrow();
    expect(() => channel.set('G-2')).not.toThrow();
    expect(channel.value).toBe('G-2');
    expect(heard).toEqual(['G-1', 'G-2']);
    expect(warn.mock.calls.filter((c) => String(c[0]).startsWith('[@iyulab/router]')).length).toBeLessThanOrEqual(1);
  });

  it('a routed navigation completes when the browser refuses the address write', async () => {
    const root = document.createElement('div');
    root.appendChild(document.createElement('u-outlet'));
    document.body.appendChild(root);
    router = new Router({
      root,
      mode: 'hash',
      routes: [
        { path: '/', render: () => 'home' },
        { path: '/orders', render: () => 'orders' },
      ],
    });
    await router.go('/');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(history, 'pushState').mockImplementation(() => { throw refusal(); });
    vi.spyOn(history, 'replaceState').mockImplementation(() => { throw refusal(); });
    await expect(router.go('/orders')).resolves.not.toThrow();
    expect(router.context?.path).toBe('/orders');
  });

  it('⚪NEGATIVE — any other error still throws', () => {
    const channel = selection<string>('refused-other', { query: 'refused-b' });
    vi.spyOn(history, 'replaceState').mockImplementation(() => { throw new TypeError('boom'); });
    expect(() => channel.set('x')).toThrow('boom');
  });
});

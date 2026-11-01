/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html } from 'lit';
import { Router, selection } from '../../src/index.js';
import '../../src/components/UOutlet.js';
import { setAddress } from './address.js';

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

afterEach(async () => {
  vi.restoreAllMocks();
  router?.destroy();
  router = undefined;
  document.body.replaceChildren();
  await setAddress(null, startPath);
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

  it('a refused new entry is written once the browser takes writes again — Back still goes one step', async () => {
    const root = document.createElement('div');
    root.appendChild(document.createElement('u-outlet'));
    document.body.appendChild(root);
    router = new Router({
      root,
      mode: 'hash',
      routes: [
        { path: '/', render: () => html`home` },
        { path: '/orders', render: () => html`orders` },
      ],
    });
    await router.go('/');
    const before = history.length;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const push = vi.spyOn(history, 'pushState').mockImplementationOnce(() => { throw refusal(); });
    await router.go('/orders');
    expect(router.context?.path).toBe('/orders');
    // Refused once — retried as the browser's window frees, as a new entry.
    await vi.waitFor(() => expect(location.hash).toBe('#/orders'), { timeout: 5000, interval: 100 });
    expect(push.mock.calls.length).toBe(2);
    // Chromium caps the session history at 50 entries; WebKit updates a frame's history length late — wait for it.
    await vi.waitFor(() => expect(history.length).toBeGreaterThanOrEqual(Math.min(before + 1, 50)));
  });

  it('⚪NEGATIVE — any other error still throws', async () => {
    // A refusal above spends the write budget; wait until a write goes through at once again.
    await new Promise((resolve) => setTimeout(resolve, 600));
    const channel = selection<string>('refused-other', { query: 'refused-b' });
    vi.spyOn(history, 'replaceState').mockImplementation(() => { throw new TypeError('boom'); });
    expect(() => channel.set('x')).toThrow('boom');
  });
});

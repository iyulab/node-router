/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { Router, selection, currentRoutePath } from '../../src/index.js';
import '../../src/components/UOutlet.js';

/**
 * **Address writes are coalesced under the browsers' rate limit.**
 *
 * Safari throws on more than 100 `replaceState` / `pushState` calls in 10 seconds; Firefox has a limit too, and Chromium
 * drops the extra calls silently. A selection bound to the address changes on every arrow key, so holding the key used to
 * write the address 30 times a second. Now writes draw on a token bucket (40, refilled 4 a second — at most 80 in any
 * 10 seconds): within it every write goes through at once, as before; once it is spent a replace waits as the pending
 * entry and only the newest one is written as tokens come back. Reads made meanwhile — another channel, the router, `currentRoutePath()` — see the pending
 * address, so two channels never erase each other's query. Going back drops the pending write: it belonged to the entry
 * that was left. A new entry (`push`) is never deferred.
 */
const startPath = window.location.pathname + window.location.search;
const budgetWindow = () => new Promise((resolve) => setTimeout(resolve, 1100));
let router: Router | undefined;

beforeEach(async () => {
  // Lets the previous test's pending write settle.
  await budgetWindow();
});

afterEach(() => {
  vi.restoreAllMocks();
  router?.destroy();
  router = undefined;
  document.body.replaceChildren();
  history.replaceState(null, '', startPath);
});

const query = (name: string) => new URL(window.location.href).searchParams.get(name);

describe('history write coalescing', () => {
  it('a burst of selection changes writes the address a few times and ends on the last value', async () => {
    const channel = selection<string>('coalesce-burst', { query: 'cb' });
    const replace = vi.spyOn(history, 'replaceState');
    for (let i = 1; i <= 100; i++) channel.set(`G-${i}`);
    expect(channel.value).toBe('G-100');
    expect(replace.mock.calls.length).toBeLessThanOrEqual(41);
    // The pending address is what readers see right away.
    expect(new URL(currentRoutePath(), location.origin).searchParams.get('cb')).toBe('G-100');
    await budgetWindow();
    expect(query('cb')).toBe('G-100');
    expect(replace.mock.calls.length).toBeLessThanOrEqual(42);
  });

  it('two channels changed during a burst keep each other\'s query', async () => {
    const a = selection<string>('coalesce-a', { query: 'ca' });
    const b = selection<string>('coalesce-b', { query: 'cbb' });
    for (let i = 1; i <= 100; i++) a.set(`A-${i}`);
    b.set('B-1');
    await budgetWindow();
    expect(query('ca')).toBe('A-100');
    expect(query('cbb')).toBe('B-1');
  });

  it('a routed selection burst ends with the router and the address on the last value', async () => {
    const root = document.createElement('div');
    root.appendChild(document.createElement('u-outlet'));
    document.body.appendChild(root);
    router = new Router({
      root,
      mode: 'hash',
      routes: [{ path: '/orders', key: () => 'orders', render: () => 'orders' }],
    });
    await router.go('/orders');
    const channel = selection<string>('coalesce-routed', { query: 'cr' });
    const replace = vi.spyOn(history, 'replaceState');
    for (let i = 1; i <= 100; i++) channel.set(`R-${i}`);
    await vi.waitFor(() => expect(router!.context?.path).toBe('/orders?cr=R-100'));
    expect(replace.mock.calls.length).toBeLessThanOrEqual(41);
    await budgetWindow();
    expect(location.hash).toBe('#/orders?cr=R-100');
  });

  it('going back drops the pending write — it belonged to the entry that was left', async () => {
    history.pushState(null, '', startPath + (startPath.includes('?') ? '&' : '?') + 'entry=second');
    const channel = selection<string>('coalesce-back', { query: 'ck' });
    for (let i = 1; i <= 100; i++) channel.set(`K-${i}`);
    await new Promise<void>((resolve) => {
      window.addEventListener('popstate', () => resolve(), { once: true });
      history.back();
    });
    await budgetWindow();
    expect(query('entry')).toBeNull();
    expect(query('ck')).toBeNull();
  });

  it('⚪NEGATIVE — a single change under the budget writes the address at once', () => {
    const channel = selection<string>('coalesce-single', { query: 'cs' });
    channel.set('S-1');
    expect(query('cs')).toBe('S-1');
  });
});

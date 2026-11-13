// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../src/Router.js';
import type { RouteError } from '../src/types/RouteError.js';
import type { RouteConfig } from '../src/types/RouteConfig.js';

/**
 * **Whatever a route throws reaches the fallback as a `RouteError`.**
 *
 * A thrown value need not be an `Error` — a guard may throw `{ status: 401 }`, a string, or nothing at all. The router reads
 * the code and message from the value when it has them and otherwise uses `UNKNOWN_ERROR` / a generic message; the thrown value
 * itself stays in `original`.
 */
describe('a thrown value of any shape becomes a RouteError', () => {
  let root: HTMLElement;
  let router: Router | undefined;
  let seen: RouteError[];

  beforeEach(() => {
    root = document.createElement('div');
    root.appendChild(document.createElement('u-outlet'));
    document.body.appendChild(root);
    history.replaceState(null, '', '/');
    seen = [];
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    router?.destroy();
    root.remove();
    vi.restoreAllMocks();
  });

  /** A guard that throws `thrown` on `/t`. */
  async function failWith(thrown: unknown): Promise<RouteError> {
    const routes: RouteConfig[] = [
      { path: '/t', enter: () => { throw thrown; }, render: () => document.createElement('section') },
    ];
    router = new Router({
      root,
      basepath: '/',
      initialLoad: false,
      routes,
      fallback: { render: (ctx) => { seen.push(ctx.error); return document.createElement('p'); } },
    });
    await router.go('/t');
    expect(seen).toHaveLength(1);
    return seen[0];
  }

  it('an object with a status keeps it as the code', async () => {
    const error = await failWith({ status: 401, message: 'sign in' });
    expect(error.code).toBe(401);
    expect(error.message).toBe('sign in');
  });

  it('an object with only a code keeps it', async () => {
    const error = await failWith({ code: 'E_QUOTA' });
    expect(error.code).toBe('E_QUOTA');
    expect(error.message).toBe('An unexpected error occurred');
  });

  it('a status of 0 or an empty code is not a code', async () => {
    const error = await failWith({ status: 0, code: '' });
    expect(error.code).toBe('UNKNOWN_ERROR');
  });

  it.each([['a string', 'nope'], ['null', null], ['undefined', undefined], ['a number', 7]])(
    '%s is UNKNOWN_ERROR with the generic message, and stays in `original`',
    async (_name, thrown) => {
      const error = await failWith(thrown);
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.message).toBe('An unexpected error occurred');
      expect(error.original).toBe(thrown);
    },
  );

  it('an Error without a status or code keeps its message', async () => {
    const thrown = new Error('boom');
    const error = await failWith(thrown);
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.message).toBe('boom');
    expect(error.original).toBe(thrown);
  });
});

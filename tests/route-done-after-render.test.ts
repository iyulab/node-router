// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LitElement, html } from 'lit';
import { createElement } from 'react';
import { Router } from '../src/Router.js';
import type { RouteConfig } from '../src/types/RouteConfig.js';

/**
 * `route-done` means the route's content has rendered — not only that rendering was scheduled.
 *
 * Whatever listens for `route-done` (a layout placing focus on the new screen, analytics reading
 * the title, a test) reads the content at that moment. React's `root.render()` only schedules a
 * commit, so the outlet used to report done while the React tree was still empty; a Lit page's
 * own first render likewise runs after it is connected. The outlet now waits for both.
 *
 * ★NEGATIVE: an in-place React update (same key) still waits — the content read at `route-done`
 * is the updated one, not the previous screen's.
 */

class ScreenPage extends LitElement {
  render() {
    return html`<input id="lit-field">`;
  }
}
customElements.define('test-route-done-screen', ScreenPage);

describe('route-done fires after the route content has rendered', () => {
  let root: HTMLElement;
  let outlet: HTMLElement;
  let router: Router | undefined;
  let seen: Array<string | null>;

  const record = () => {
    const react = outlet.querySelector('#react-field');
    const lit = outlet.querySelector('test-route-done-screen')?.shadowRoot?.querySelector('#lit-field');
    seen.push(react?.getAttribute('data-q') ?? (lit ? 'lit' : null));
  };

  beforeEach(() => {
    root = document.createElement('div');
    outlet = document.createElement('u-outlet');
    root.appendChild(outlet);
    document.body.appendChild(root);
    history.replaceState(null, '', '/');
    seen = [];
    window.addEventListener('route-done', record);
  });

  afterEach(() => {
    window.removeEventListener('route-done', record);
    router?.destroy();
    root.remove();
  });

  function make(routes: RouteConfig[]) {
    router = new Router({ root, basepath: '/', routes, initialLoad: false });
    return router;
  }

  it('a React route is committed when route-done fires', async () => {
    const r = make([{ path: '/react', render: (ctx) => createElement('input', { id: 'react-field', 'data-q': ctx.query.get('q') ?? 'first' }) }]);
    await r.go('/react');
    expect(seen).toEqual(['first']);
  });

  it('an in-place React update is committed when route-done fires', async () => {
    const r = make([{
      path: '/react',
      key: (ctx) => ctx.pathname,
      render: (ctx) => createElement('input', { id: 'react-field', 'data-q': ctx.query.get('q') ?? 'first' }),
    }]);
    await r.go('/react');
    await r.go('/react?q=second');
    expect(seen).toEqual(['first', 'second']);
  });

  it('a Lit page has rendered its own template when route-done fires', async () => {
    const r = make([{ path: '/lit', render: () => html`<test-route-done-screen></test-route-done-screen>` }]);
    await r.go('/lit');
    expect(seen).toEqual(['lit']);
  });
});

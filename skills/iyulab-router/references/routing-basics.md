# Routing Basics

## Minimal Setup

```ts
import { Router } from '@iyulab/router';
import { html } from 'lit';

const router = new Router({
  root: document.body,
  basepath: '/',
  routes: [
    { index: true, render: () => html`<home-page></home-page>` },
    { path: '/users/:id', render: (ctx) => html`<user-page .id=${ctx.params.id}></user-page>` },
  ],
  fallback: {
    render: (ctx) => html`<error-page .error=${ctx.error}></error-page>`,
  },
});
```

## RouterConfig Options

| Option | Default | Description |
|---|---|---|
| `root` | - | Mount element (required) |
| `basepath` | `'/'` | URL base path |
| `mode` | `'history'` | Where the route lives in the address: `'history'` = the path, `'hash'` = after `#` (see below) |
| `routes` | `[]` | Route definitions |
| `enter` | - | Global guard before navigation |
| `fallback` | built-in error page | Error/404 handler |
| `useIntercept` | `true` | Intercept `<a>` clicks for client routing |
| `initialLoad` | `true` | Auto-navigate on initialization |
| `scrollRestoration` | `false` | Per-entry scroll memory: Back/Forward/reload return to where you were, a new navigation starts at the top (`#hash` → that element). `{ container: () => el }` when an inner box scrolls, not the document |

## Hash mode — static hosting without a server fallback

With `mode: 'history'` (the default) the route is the address path, so a refresh or a deep link to
`/app/orders/7` only works when the server returns the app's document for every path. With
`mode: 'hash'` the route lives after `#` — `/app/#/orders/7` — and the server only ever serves one
document.

```ts
const router = new Router({ root, mode: 'hash', routes });
router.go('/orders/7');   // address becomes …/#/orders/7 — the path is untouched
```

- `basepath`, route paths, `router.go()`, `ctx.pathname` and `ctx.query` all work on the part after
  `#`; `ctx.href` is the route URL (origin + route path), not the address.
- `<u-link href="/orders/7">` renders `href="#/orders/7"`, so opening it in a new tab lands on the
  same screen. A plain `<a href="#/orders/7">` is routed too, and so are back/forward and editing the
  `#` part of the address.
- A fragment inside a route (`#section`) is not available — the `#` is the route.

## Navigation

```ts
router.go('/dashboard');
router.go('settings');
router.go('/orders/7', { state: { tab: 'log' } });   // read back from history.state — also after Back/Forward or a reload
router.destroy();
```

Code that does not hold the router — a shell, an auth-expiry handler — asks for a navigation with `navigate()`.
The running router performs it (a new entry; `{ replace: true }` replaces); with no router it is a document
navigation. Do not imitate it with `history.pushState` plus a dispatched `popstate`: that event reads as Back to
everything listening, and an entry written without the router's state loses its mode and entry key.

```ts
import { navigate } from '@iyulab/router';
navigate('/login', { replace: true });
```

`<u-link>` uses the same request.

### How a screen was reached

`context.navigation` says how the route was entered: `type` is `push` (a new entry), `replace`, `reload`, or
`traverse` (Back/Forward returned to an existing entry), and `entryKey` names the history entry — the same value
when you come back to it. Restore per-entry memory (scroll, selection) on `traverse`, keyed by `entryKey`:

```ts
window.addEventListener('route-done', (e) => {
  const { type, entryKey } = e.context.navigation;
  if (type === 'traverse') restore(entryKey);
});
```

For the scroll position itself, turn on `scrollRestoration` — it waits for a late-growing screen (data arriving after render) to reach the saved position, and stops if the person scrolls first.

## Selection channels

Several views that follow one «current pick» (list · side panel · open tab) share a named channel:
`selection<T>(name, { query?, parse?, format?, history? })` → `{ value, signal, set(v), subscribe(fn(value, signal)), follow(fn) }`.
Same name, same channel. `query` makes the address the source (deep link · Back); `history: 'push'` makes each pick an
entry (default `'replace'`). The `signal` passed with each value aborts on the next pick — hand it to the fetch.
`follow()` gives a view `pin()`/`unpin()`. Adapters: Lit `SelectionController(host, channel)` · React `useSelection(channel)`
(`@iyulab/router/react`). Give the route a `key` so a query-only change does not remount the screen.

```ts
const order = selection<string>('order', { query: 'order' });
order.subscribe((id, signal) => { if (id) load(id, { signal }); });
order.set('G-7');
```

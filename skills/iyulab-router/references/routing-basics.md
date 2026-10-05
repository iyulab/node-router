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
router.destroy();
```
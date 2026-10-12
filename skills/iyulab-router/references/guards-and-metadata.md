# Guards and Metadata

## Global Guard

```ts
const router = new Router({
  root: document.body,
  enter: (ctx) => {
    if (!isAuthenticated() && ctx.pathname !== '/login') return '/login';
    return true;
  },
  routes: [...],
});
```

## Route Guard

```ts
{
  path: '/admin',
  enter: () => hasRole('admin') || '/forbidden',
  render: () => html`<admin-page></admin-page>`
}
```

Guard return values:
- `true` or `undefined`: continue
- `false`: cancel navigation
- `string`: redirect

## Leave Guard

`leave` is the other side of `enter`: it runs before the current screen is replaced, so a screen with unsaved
input can ask first. Return `false` to stay — the screen and the address do not change.

```typescript
{
  path: '/orders/:id',
  leave: () => !form.dirty || confirm('Discard your changes?'),
  render: (ctx) => html`<order-page .id=${ctx.params.id}></order-page>`,
}
```

- It receives `{ from, to }`: the current screen's context and the destination (address only — `to.params` and
  `to.metadata` are empty; `to.navigation.type` is `push`, `replace` or `traverse`).
- It runs for every navigation that changes the path or query — links, `go()`, `navigate()`, a selection channel
  that goes through the router, Back and Forward. A hash-only change, redirect hops and the first route do not ask.
- Route guards of the current screen run child first, then the global `RouterConfig.leave`. The first `false` stops;
  a guard that throws counts as `false`. A guard may return a promise (an in-app dialog).
- A guard that answers right away (a boolean) does not delay anything — the navigation goes on in the same tick, as
  without guards. Only a guard that returns a promise is waited for.
- Back and Forward have no «cancel» in the History API. When a guard does not let a Back or Forward through right
  away, the router returns to the entry you were on, waits for the answer, and goes the same number of entries again
  if the guard allows it.
- Leaving the document (reload, another site, closing the tab) is not a navigation the router sees — use the
  browser's `beforeunload` for that.

## Route Metadata

```ts
{
  path: '/admin',
  metadata: { requiresAuth: true, section: 'admin' },
  render: (ctx) => {
    // merged metadata from matched chain
    console.log(ctx.metadata);
    return html`<admin-layout><u-outlet></u-outlet></admin-layout>`;
  },
  children: [
    {
      path: 'settings',
      metadata: { tab: 'settings' },
      render: (ctx) => html`<settings-page .metadata=${ctx.metadata}></settings-page>`
    }
  ]
}
```

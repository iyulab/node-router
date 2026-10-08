# Events and Errors

## Route Events

```ts
window.addEventListener('route-begin', (e) => {
  console.log(e.context.pathname);
});

window.addEventListener('route-progress', (e) => {
  progressBar.value = e.progress;
});

window.addEventListener('route-done', (e) => {
  analytics.track(e.context.pathname);
});

window.addEventListener('route-error', (e) => {
  errorTracker.report(e.error);
});
```

## Current route without the router

`currentRoutePath()` reads the current location as a route path (`RouteContext.path` form — path + query + hash),
in the router's mode (`history` or `hash`), with no router instance. Use it to initialise a widget that follows
`route-begin` but may connect after the first navigation (a shell rendered as a route's parent) — it has missed
that event.

```typescript
import { currentRoutePath } from '@iyulab/router';
let path = currentRoutePath();
window.addEventListener('route-begin', (e) => { path = e.context.path; });
```

## Fallback

`ctx.error` is a `RouteError`. `title` may be a string or a function of the same context — use the
function when the tab title should differ by failure; with a string (or no title) every failure gets the
same one, and with none the error message becomes the title.

```ts
fallback: {
  title: (ctx) => (ctx.error.code === 404 ? 'Page not found' : 'Something went wrong'),
  render: (ctx) => {
    const { code, message } = ctx.error;
    if (code === 404) return html`<not-found-page></not-found-page>`;
    return html`<error-page .message=${message}></error-page>`;
  }
}
```

## Error Codes

`code` is the HTTP-like status for the two expected failures and a string for the others. Each has its
own class, exported from the package, so `instanceof` works as well.

| `code` | Class | When |
|---|---|---|
| `404` | `NotFoundError` | No route matches the address |
| `403` | `AccessDeniedError` | An `enter` guard returned `false` |
| `'OUTLET_MISSING'` | `OutletMissingError` | The matched route has no `<u-outlet>` to render into |
| `'CONTENT_LOAD_FAILED'` | `ContentLoadError` | The route's `render()` threw, or returned nothing |
| `'CONTENT_RENDER_FAILED'` | `ContentRenderError` | The outlet could not render what `render()` returned |

A route can choose its own failure: a `RouteError` thrown from `render()` reaches the fallback unchanged,
so a screen whose record does not exist shows the 404 screen:

```ts
import { NotFoundError } from '@iyulab/router';

{ path: '/orders/:id', render: async (ctx) => {
  const order = await fetchOrder(ctx.params.id);
  if (!order) throw new NotFoundError(ctx.pathname);
  return html`<order-page .order=${order}></order-page>`;
} }
```

Anything else thrown from `render()` becomes a `ContentLoadError` (its `original` is what was thrown). An
error thrown from an `enter` guard keeps its own `status` or `code` when it has one, otherwise the code is
`'UNKNOWN_ERROR'`.

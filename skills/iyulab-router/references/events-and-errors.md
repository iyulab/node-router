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

```ts
fallback: {
  render: (ctx) => {
    const { code, message } = ctx.error;
    if (code === 'NOT_FOUND') return html`<not-found-page></not-found-page>`;
    return html`<error-page .message=${message}></error-page>`;
  }
}
```

## Error Codes

- `NOT_FOUND`
- `CONTENT_LOAD_ERROR`
- `CONTENT_RENDER_ERROR`

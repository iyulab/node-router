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

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

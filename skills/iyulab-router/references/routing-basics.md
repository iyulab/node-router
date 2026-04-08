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
| `routes` | `[]` | Route definitions |
| `enter` | - | Global guard before navigation |
| `fallback` | built-in error page | Error/404 handler |
| `useIntercept` | `true` | Intercept `<a>` clicks for client routing |
| `initialLoad` | `true` | Auto-navigate on initialization |

## Navigation

```ts
router.go('/dashboard');
router.go('settings');
router.destroy();
```
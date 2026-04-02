# @iyulab/router — Reference

## URL Parameter Patterns

```ts
// Required
{ path: '/user/:id' }

// Optional
{ path: '/posts/:category?' }

// Wildcard (catch-all)
{ path: '/docs/:path*' }

// Multiple
{ path: '/org/:orgId/repo/:repoId' }
```

Access via `ctx.params.id`, `ctx.params.category`, etc.

## Query String

```ts
// URL: /search?q=hello&page=2
ctx.query.get('q')     // 'hello'
ctx.query.get('page')  // '2'
```

## Route Meta

Meta from the full matched chain is merged (parent → child, child overrides):

```ts
{
  path: '/admin',
  meta: { requiresAuth: true, layout: 'admin' },
  render: (ctx) => {
    // ctx.meta === { requiresAuth: true, layout: 'admin' }
    return html`<admin-layout><u-outlet></u-outlet></admin-layout>`;
  },
  children: [
    {
      path: 'settings',
      meta: { role: 'superadmin' },
      render: (ctx) => {
        // ctx.meta === { requiresAuth: true, layout: 'admin', role: 'superadmin' }
        return html`<admin-settings></admin-settings>`;
      }
    }
  ]
}
```

## Async Render with Progress

```ts
{
  path: '/user/:id',
  render: async (ctx) => {
    ctx.progress(20);
    const user = await fetchUser(ctx.params.id);
    ctx.progress(80);
    return html`<user-profile .data=${user}></user-profile>`;
  }
}
```

## Route Events

```ts
window.addEventListener('route-begin', (e) => {
  console.log('navigating to:', e.context.pathname);
});

window.addEventListener('route-progress', (e) => {
  progressBar.value = e.progress; // 0–100
});

window.addEventListener('route-done', (e) => {
  analytics.track(e.context.pathname);
});

window.addEventListener('route-error', (e) => {
  errorTracker.report(e.error);
});
```

## Error Fallback

```ts
fallback: {
  render: (ctx) => {
    const { code, message } = ctx.error;
    if (code === 'NOT_FOUND') return html`<not-found-page></not-found-page>`;
    return html`<error-page .message=${message}></error-page>`;
  }
}
```

## React Usage

```tsx
import { UOutlet, ULink } from '@iyulab/router/react';

export function AppRoot() {
  return (
    <div>
      <nav>
        <ULink href="/">Home</ULink>
        <ULink href="/about">About</ULink>
      </nav>
      <main>
        <UOutlet />
      </main>
    </div>
  );
}
```

Mixed Lit + React routes:

```ts
const routes = [
  {
    path: '/lit-page',
    render: () => html`<my-lit-component></my-lit-component>`
  },
  {
    path: '/react-page',
    render: () => <MyReactComponent />
  },
  {
    path: '/raw-element',
    render: (ctx) => {
      const el = document.createElement('my-element');
      el.data = ctx.params;
      return el;
    }
  }
];
```

## RouterConfig Options

| Option | Default | Description |
|---|---|---|
| `root` | — | Mount element (required) |
| `basepath` | `'/'` | URL base path |
| `routes` | `[]` | Route definitions |
| `fallback` | built-in error page | Error/404 handler |
| `useIntercept` | `true` | Intercept `<a>` clicks for client routing |
| `initialLoad` | `true` | Auto-navigate to current URL on init |

## Lit Element Integration

```ts
import "@iyulab/router"; // registers <u-outlet> and <u-link>
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('app-root')
export class AppRoot extends LitElement {
  render() {
    return html`
      <nav>
        <u-link href="/">Home</u-link>
        <u-link href="/about">About</u-link>
      </nav>
      <main>
        <u-outlet></u-outlet>
      </main>
    `;
  }
}
```

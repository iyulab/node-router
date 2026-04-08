# @iyulab/router

Client-side SPA router for Lit and React with URLPattern matching, nested routes, and route lifecycle events.

## Installation

```bash
npm install @iyulab/router
```

## Quick Start

```typescript
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

router.go('/users/1');
```

## Skills Usage

Install the `iyulab-router` skill for agent-friendly package guidance.

```bash
npx skills add iyulab/node-router
```

```bash
npx skills add ./node_modules/@iyulab/router
```

## Route Guards

Use `enter` to run guard logic before rendering.

```typescript
const router = new Router({
  root: document.body,
  enter: (ctx) => {
    if (!isAuthenticated() && ctx.pathname !== '/login') return '/login';
    return true;
  },
  routes: [
    { path: '/login', render: () => html`<login-page></login-page>` },
    {
      path: '/admin',
      enter: () => hasRole('admin') || '/forbidden',
      render: () => html`<admin-page></admin-page>`,
    },
  ],
});
```

`enter` return values:
- `true` (or `undefined`): continue
- `false`: cancel navigation
- `string`: redirect to that path

## Route Metadata

Attach metadata to routes using `metadata`. The router merges metadata from parent to child and exposes it on `ctx.metadata`.

```typescript
const routes = [
  {
    path: '/dashboard',
    metadata: { requiresAuth: true, section: 'dashboard' },
    render: () => html`<dashboard-layout><u-outlet></u-outlet></dashboard-layout>`,
    children: [
      {
        path: 'settings',
        metadata: { tab: 'settings' },
        render: (ctx) => html`<settings-page .metadata=${ctx.metadata}></settings-page>`,
      },
    ],
  },
];
```

## Nested Routes

Parent routes must render `<u-outlet>` to host child route content.

```typescript
const routes = [
  {
    path: '/nested',
    render: () => html`<nested-layout><u-outlet></u-outlet></nested-layout>`,
    children: [
      { index: true, render: () => html`<nested-home></nested-home>` },
      { path: 'lit', render: () => html`<nested-lit></nested-lit>` },
      { path: 'react', render: () => <NestedReact /> },
    ],
  },
];
```

## Link and Outlet Components

- `<u-link>`: SPA-aware anchor element
- `<u-outlet>`: render target for matched route output

`<u-link>` supports `href`, `target`, and `rel`.

```html
<u-link href="/docs">Docs</u-link>
<u-link href="https://example.com" target="_blank" rel="noopener noreferrer">External</u-link>
```

React wrappers:

```tsx
import { ULink, UOutlet } from '@iyulab/router/react';
```

## Route Events

The router dispatches events on `window`:

- `route-begin`
- `route-progress`
- `route-done`
- `route-error`

```typescript
window.addEventListener('route-progress', (e) => {
  console.log(e.progress);
});
```

## License

MIT License. See [LICENSE](LICENSE).

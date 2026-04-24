---
name: iyulab-router
description: Client-side SPA router for Lit and React with URLPattern matching, nested routes, route guards, metadata merging, fallback handling, and route events. Use when working with @iyulab/router to define routes, add guards, handle navigation, or integrate <u-outlet>/<u-link>.
license: MIT
compatibility: Browser environments only (requires URLPattern and History API)
metadata:
  author: iyulab
  version: "0.9.3"
---

# @iyulab/router

Client-side router supporting Lit and React renders, nested routes, route guards, and URLPattern-based matching.

## Install

```bash
npm install @iyulab/router
```

## Core API

| Export | Purpose |
|---|---|
| `Router` | Main router class |
| `RouteConfig` | Route definition type |
| `RouterConfig` | Constructor config type |
| `RouteContext` | Passed to every `render()` call |
| `FallbackRouteConfig` | Error/404 fallback definition |
| `<u-outlet>` | Renders the matched route output |
| `<u-link>` | Client-side navigation anchor |
| `UOutlet`, `ULink` | React wrappers (from `@iyulab/router/react`) |

## Router Setup

```ts
import { Router } from '@iyulab/router';
import { html } from 'lit';

const router = new Router({
  root: document.body,       // required — mount element containing <u-outlet>
  basepath: '/',             // optional
  enter: (ctx) => {
    if (!isAuthenticated() && ctx.pathname !== '/login') return '/login';
    return true;
  },
  routes: [
    { index: true, render: () => html`<home-page></home-page>` },
    { path: '/user/:id', render: (ctx) => html`<user-page .id=${ctx.params.id}></user-page>` },
    {
      path: '/admin',
      metadata: { role: 'admin' },
      enter: (ctx) => ctx.metadata.role === 'admin' || '/forbidden',
      render: () => html`<admin-page></admin-page>`,
    },
  ],
  fallback: {
    render: (ctx) => html`<error-page .error=${ctx.error}></error-page>`
  }
});
```

## RouteConfig Fields

| Field | Type | Description |
|---|---|---|
| `path` | `string \| URLPattern` | URLPattern path; omit when `index: true` |
| `index` | `true` | Marks route as index of its parent path |
| `render` | `(ctx) => unknown` | Returns Lit `TemplateResult`, React element, or `HTMLElement` |
| `enter` | `(ctx) => string \| boolean \| Promise<string \| boolean>` | Guard before route render (`false` cancel, `string` redirect) |
| `children` | `RouteConfig[]` | Nested routes; parent must render `<u-outlet>` |
| `title` | `string` | Sets `document.title` on match |
| `metadata` | `Record<string, unknown>` | Arbitrary metadata (auth, layout, analytics) |
| `force` | `boolean` | Force re-render on URL change (default `true` for leaf routes) |

## RouteContext Fields

```ts
ctx.params     // URLPattern captured params
ctx.pathname   // path without query/hash
ctx.path       // full path including query + hash
ctx.query      // URLSearchParams
ctx.metadata   // merged metadata from matched route chain
ctx.progress   // (value: number) => void — report 0–100 loading progress
```

## Nested Routes

Parent must include `<u-outlet>` in its render output:

```ts
{
  path: '/dashboard',
  render: () => html`<dashboard-layout><u-outlet></u-outlet></dashboard-layout>`,
  children: [
    { index: true, render: () => html`<dashboard-home></dashboard-home>` },
    { path: 'settings', render: () => html`<dashboard-settings></dashboard-settings>` }
  ]
}
```

## Navigation

```ts
router.go('/path');                  // programmatic navigation
router.go('relative-path');         // relative to basepath
router.destroy();                   // remove event listeners

// From Lit template
html`<u-link href="/about">About</u-link>`

// From React
import { ULink } from '@iyulab/router/react';
<ULink href="/about">About</ULink>
```

`<u-link>` supports `href`, `target`, and `rel`.

```html
<u-link href="https://example.com" target="_blank" rel="noopener noreferrer">External</u-link>
```

## Route Events (window)

| Event | Fired when |
|---|---|
| `route-begin` | Navigation starts |
| `route-progress` | Async progress update (0–100) |
| `route-done` | Navigation completes |
| `route-error` | Routing error occurs |

## Error Types (fallback ctx.error)

| Code | Class |
|---|---|
| `NOT_FOUND` | `NotFoundError` |
| `CONTENT_LOAD_ERROR` | `ContentLoadError` |
| `CONTENT_RENDER_ERROR` | `ContentRenderError` |

References:
- [references/routing-basics.md](references/routing-basics.md)
- [references/url-pattern.md](references/url-pattern.md)
- [references/guards-and-metadata.md](references/guards-and-metadata.md)
- [references/components.md](references/components.md)
- [references/events-and-errors.md](references/events-and-errors.md)

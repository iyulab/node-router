---
name: iyulab-router
description: Client-side SPA router for Lit and React with URLPattern-based matching, nested routes, fallback handling, and route events. Use when working with @iyulab/router — setting up routing, defining routes, handling navigation, nested layouts with <u-outlet>, or listening to route lifecycle events.
license: MIT
compatibility: Browser environments only (requires URLPattern and History API)
metadata:
  author: iyulab
  version: "0.7.4"
---

# @iyulab/router

Client-side router supporting Lit and React renders, nested routes, and URLPattern-based matching.

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
  routes: [
    { index: true, render: () => html`<home-page></home-page>` },
    { path: '/user/:id', render: (ctx) => html`<user-page .id=${ctx.params.id}></user-page>` },
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
| `children` | `RouteConfig[]` | Nested routes; parent must render `<u-outlet>` |
| `title` | `string` | Sets `document.title` on match |
| `meta` | `Record<string, unknown>` | Arbitrary metadata (auth, layout, analytics) |
| `force` | `boolean` | Force re-render on URL change (default `true` for leaf routes) |

## RouteContext Fields

```ts
ctx.params     // URLPattern captured params
ctx.pathname   // path without query/hash
ctx.path       // full path including query + hash
ctx.query      // URLSearchParams
ctx.meta       // merged meta from matched route chain
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

See [references/REFERENCE.md](references/REFERENCE.md) for URL parameter patterns, React usage, and advanced examples.

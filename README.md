# @iyulab/router

A modern, lightweight client-side router for web applications with support for both Lit and React components.

## Features

- 🚀 **Modern URLPattern-based routing** - Uses native URLPattern API for powerful path matching
- 🔧 **Unified Framework Support** - Works with both Lit and React components using render functions
- 📱 **Client-Side Navigation** - History API integration with browser back/forward support
- 🎯 **Nested Routing** - Support for deeply nested route hierarchies with index and path routes
- 📊 **Route Events** - Track navigation progress with route-begin, route-done, and route-error events
- ⚠️ **Enhanced Error Handling** - Built-in ErrorPage component with improved styling

## Installation

```bash
npm install @iyulab/router
```

## Quick Start

### Basic Setup

```typescript
import { Router } from '@iyulab/router';
import { html } from 'lit';

const router = new Router({
  basepath: '/',
  routes: [
    {
      index: true,
      render: () => html`<home-page></home-page>`
    },
    {
      path: '/user/:id', // URLPattern route
      render: (routeInfo) => html`<user-page .userId=${routeInfo.params.id}></user-page>`
    }
  ],
});
```

### Mixed Framework Support

```typescript
import React from 'react';

const routes = [
  // Lit component
  {
    path: '/lit-page',
    render: (routeInfo) => {
      return html`<my-lit-component .routeInfo=${routeInfo}></my-lit-component>`
    }
  },
  // React component
  {
    path: '/react-page',
    render: (routeInfo) => {
      return ( <MyComponent></MyComponent> )
    }
  },
  // HTML element
  {
    path: '/element-page',
    render: (routeInfo) => {
      const element = document.createElement('my-element');
      element.data = routeInfo.params;
      return element;
    }
  }
];
```

### Nested Routes

```typescript
import { RouteConfig } from '@iyulab/router';

const routes: RouteConfig[] = [
  {
    path: '/dashboard',
    render: () => html`<dashboard-layout><u-outlet></u-outlet></dashboard-layout>`,
    children: [
      {
        index: true, // Matches '/dashboard'
        render: () => html`<dashboard-home></dashboard-home>`
      },
      {
        path: 'settings', // Matches '/dashboard/settings'
        render: () => html`<dashboard-settings></dashboard-settings>`
      }
    ]
  }
];
```

## Usage Examples

### Using with Lit Elements

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import "@iyulab/router";

@customElement('app-root')
export class AppRoot extends LitElement {
  render() {
    return html`
      <nav>
        <u-link href="/">Home</u-link>
        <u-link href="/about">About</u-link>
        <u-link href="/user/123">User Profile</u-link>
      </nav>
      <main>
        <u-outlet></u-outlet>
      </main>
    `;
  }
}
```

### Using with React Components

```tsx
import React from 'react';
import { UOutlet, ULink } from '@iyulab/router/react';

export function AppRoot() {
  return (
    <div>
      <nav>
        <ULink href="/">Home</ULink>
        <ULink href="/about">About</ULink>
        <ULink href="/user/123">User Profile</ULink>
      </nav>
      <main>
        <UOutlet />
      </main>
    </div>
  );
}
```

## Error Handling

The router provides comprehensive error handling through `FallbackRouteContext`. When a routing error occurs, the fallback render function receives a context with full error information:

```typescript
const router = new Router({
  root: document.body,
  basepath: '/',
  routes: [...],
  fallback: {
    title: 'Error',
    render: (ctx) => {
      // ctx.error contains RouteError with code, message, and original error
      const { code, message, original } = ctx.error;

      if (code === 'NOT_FOUND') {
        return html`<not-found-page .path=${ctx.pathname}></not-found-page>`;
      }
      if (code === 'CONTENT_LOAD_ERROR') {
        return html`<error-page .message=${message}></error-page>`;
      }
      return html`<error-page .error=${ctx.error}></error-page>`;
    }
  }
});
```

Error types:
- `NotFoundError` — No matching route found (code: `NOT_FOUND`)
- `ContentLoadError` — Route render function threw an error (code: `CONTENT_LOAD_ERROR`)
- `ContentRenderError` — Outlet rendering failed (code: `CONTENT_RENDER_ERROR`)

## Route Metadata

Routes can carry arbitrary metadata via the `meta` field. When a route matches, metadata from the entire matched route chain is merged (parent → child order, child overrides parent):

```typescript
const router = new Router({
  root: document.body,
  basepath: '/',
  routes: [
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
          meta: { requiresAuth: true, role: 'superadmin' },
          render: (ctx) => {
            // ctx.meta === { requiresAuth: true, layout: 'admin', role: 'superadmin' }
            return html`<admin-settings></admin-settings>`;
          }
        }
      ]
    }
  ]
});
```

Use cases: authentication guards, SEO tags, analytics tracking, layout selection, and more.

## Route Events

The router dispatches events on the `window` object during navigation:

| Event | Type | Description |
|-------|------|-------------|
| `route-begin` | `RouteBeginEvent` | Fired when navigation starts |
| `route-progress` | `RouteProgressEvent` | Fired during async loading (0–100) |
| `route-done` | `RouteDoneEvent` | Fired when navigation completes successfully |
| `route-error` | `RouteErrorEvent` | Fired when a routing error occurs |

```typescript
// Track navigation progress
window.addEventListener('route-progress', (e: RouteProgressEvent) => {
  progressBar.value = e.progress;
});

// Log navigation events
window.addEventListener('route-begin', (e: RouteBeginEvent) => {
  console.log('Navigating to:', e.context.pathname);
});

window.addEventListener('route-done', (e: RouteDoneEvent) => {
  analytics.trackPageView(e.context.pathname);
});

window.addEventListener('route-error', (e: RouteErrorEvent) => {
  errorTracker.report(e.error);
});
```

## URL Parameters

The router supports URLPattern-based parameter matching:

```typescript
const routes: RouteConfig[] = [
  // Required parameter
  { path: '/user/:id', render: (ctx) => html`<user-page .id=${ctx.params.id}></user-page>` },

  // Optional parameter
  { path: '/posts/:category?', render: (ctx) => {
    const category = ctx.params.category || 'all';
    return html`<posts-page .category=${category}></posts-page>`;
  }},

  // Wildcard (catch-all)
  { path: '/docs/:path*', render: (ctx) => html`<docs-page .path=${ctx.params.path}></docs-page>` },

  // Multiple parameters
  { path: '/org/:orgId/repo/:repoId', render: (ctx) => {
    return html`<repo-page .orgId=${ctx.params.orgId} .repoId=${ctx.params.repoId}></repo-page>`;
  }}
];
```

When URL parameters change (e.g., navigating from `/user/1` to `/user/2`), leaf routes (without children) automatically re-render since `force` defaults to `true`. For parent routes with children, set `force: true` explicitly if re-rendering is needed on parameter changes.

## License

MIT License - see [LICENSE](LICENSE) file for details.

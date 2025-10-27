# @iyulab/router

A modern, lightweight client-side router for web applications with support for both Lit and React components.

## Features

- 🚀 **Modern URLPattern-based routing** - Uses native URLPattern API for powerful path matching
- 🔧 **Dual Framework Support** - Works with both Lit and React components
- 📱 **Client-side Navigation** - History API integration with browser back/forward support
- 🎯 **Nested Routing** - Support for deeply nested route hierarchies
- ⚡ **Async Data Loading** - Built-in loader functions for data fetching
- 🔗 **Smart Link Component** - Automatic external link detection and handling
- 📊 **Route Events** - Track navigation progress and handle errors
- 🎨 **Flexible Outlet System** - Dynamic component rendering with lifecycle management
- 🌐 **Global Route Access** - Access current route information anywhere via `window.route`
- 🔄 **Force Re-rendering** - Control component re-rendering on route changes

## Installation

```bash
npm install @iyulab/router
```

## Quick Start

### Basic Setup

```typescript
import { Router } from '@iyulab/router';

const router = new Router({
  root: document.getElementById('app')!,
  basepath: '/app',
  routes: [
    {
      path: '/',
      element: 'home-page'
    },
    {
      path: '/user/:id',
      component: UserComponent,
      loader: async (routeInfo) => {
        const response = await fetch(`/api/user/${routeInfo.params.id}`);
        return response.json();
      }
    }
  ]
});

// Start routing
router.go(window.location.href);
```

## Usage Examples

### Using with Lit Components

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

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
import { Outlet, Link } from '@iyulab/router';

export function AppRoot() {
  return (
    <div>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/user/123">User Profile</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

### Advanced Routing Features

#### Nested Routes with Layouts

```typescript
const routes = [
  {
    path: '/dashboard',
    element: 'dashboard-layout',
    children: [
      {
        index: true, // Matches /dashboard exactly
        element: 'dashboard-home'
      },
      {
        path: 'settings',
        element: 'dashboard-settings'
      },
      {
        path: 'profile',
        component: ProfileComponent
      },
      {
        path: 'users/:id',
        component: UserDetailComponent,
        loader: async (routeInfo) => {
          const userId = routeInfo.params.id;
          return await fetchUserData(userId);
        }
      }
    ]
  }
];
```

#### Route Data Loading

```typescript
// Routes with async data loading
{
  path: '/posts/:slug',
  component: PostComponent,
  loader: async (routeInfo) => {
    const { slug } = routeInfo.params;
    const post = await fetch(`/api/posts/${slug}`).then(r => r.json());
    return { post };
  },
  title: 'Blog Post' // Sets document title
}
```

#### Force Re-rendering Control

```typescript
const routes = [
  {
    path: '/live-data',
    component: LiveDataComponent,
    force: true // Always re-render on navigation
  },
  {
    path: '/cached-content',
    component: CachedComponent,
    force: false // Reuse existing component instance
  }
];
```

### Global Route Information Access

Access current route information anywhere in your application:

```typescript
// Available globally on window.route
console.log('Current path:', window.route.pathname);
console.log('Route params:', window.route.params);
console.log('Query params:', window.route.search);
console.log('Loaded data:', window.route.data);
```

#### Lit Component Route Integration

```typescript
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('route-aware-component')
export class RouteAwareComponent extends LitElement {
  @state() private routeInfo = window.route;

  connectedCallback() {
    super.connectedCallback();
    // Listen for route changes
    window.addEventListener('route-end', this.handleRouteChange);
  }

  disconnectedCallback() {
    window.removeEventListener('route-end', this.handleRouteChange);
    super.disconnectedCallback();
  }

  private handleRouteChange = (event: CustomEvent) => {
    this.routeInfo = event.detail;
    this.requestUpdate();
  };

  render() {
    return html`
      <div>Current path: ${this.routeInfo?.pathname}</div>
      <div>User ID: ${this.routeInfo?.params?.id}</div>
      <div>Data: ${JSON.stringify(this.routeInfo?.data)}</div>
    `;
  }
}
```

#### React Component Route Integration

```tsx
import React, { useState, useEffect } from 'react';

export function RouteAwareComponent() {
  const [routeInfo, setRouteInfo] = useState(window.route);

  useEffect(() => {
    const handleRouteChange = (event) => {
      setRouteInfo(event.detail);
    };

    window.addEventListener('route-end', handleRouteChange);
    return () => window.removeEventListener('route-end', handleRouteChange);
  }, []);

  return (
    <div>
      <div>Current path: {routeInfo?.pathname}</div>
      <div>User ID: {routeInfo?.params?.id}</div>
      <div>Data: {JSON.stringify(routeInfo?.data)}</div>
    </div>
  );
}
```

## API Reference

### Router Class

#### Constructor

```typescript
new Router(config: RouterConfig)
```

**RouterConfig:**
- `root: HTMLElement` - Root element where router renders components
- `basepath?: string` - Base path for all routes (default: '/')
- `routes: RouteConfig[]` - Array of route configurations

#### Methods

- `go(href: string): Promise<void>` - Navigate to specified path
- `get basepath(): string` - Get current base path
- `get routeInfo(): RouteInfo | undefined` - Get current route information

### Route Configuration

```typescript
interface RouteConfig {
  id?: string;                    // Unique route identifier (auto-generated)
  path?: string;                  // URL pattern (URLPattern syntax)
  index?: boolean;                // Index route (matches parent exactly)
  title?: string;                 // Document title
  element?: typeof LitElement | string;  // Lit element class or tag name
  component?: ComponentType;      // React component
  loader?: (info: RouteInfo) => Promise<any>;  // Async data loader
  children?: RouteConfig[];       // Nested routes
  force?: boolean;                // Force re-render on navigation
}
```

#### URLPattern Examples

```typescript
// Static paths
{ path: '/about' }
{ path: '/contact' }

// Dynamic parameters
{ path: '/user/:id' }
{ path: '/blog/:year/:month/:slug' }

// Optional parameters
{ path: '/posts/:id?' }

// Wildcard matching
{ path: '/files/*' }
{ path: '/api/**' }
```

### Components

#### u-outlet / Outlet

Renders the matched route component.

```html
<!-- Lit usage -->
<u-outlet></u-outlet>
```

```jsx
// React usage
<Outlet />
```

#### u-link / Link

Smart navigation link with automatic external link detection.

```html
<!-- Lit usage -->
<u-link href="/about">About</u-link>
<u-link href="https://example.com">External</u-link>
```

```jsx
// React usage
<Link href="/about">About</Link>
<Link href="https://example.com">External</Link>
```

### Route Information

```typescript
interface RouteInfo {
  pathname: string;              // Current pathname
  search: string;                // Query string
  hash: string;                  // URL hash
  href: string;                  // Full URL
  basepath: string;              // Router base path
  params: Record<string, string>; // Route parameters
  data?: any;                    // Data from loader function
}
```

### Events

The router dispatches these events on the `window` object:

- **`route-start`** - Navigation begins
  ```typescript
  window.addEventListener('route-start', (event) => {
    console.log('Navigating to:', event.detail.pathname);
  });
  ```

- **`route-end`** - Navigation completes successfully
  ```typescript
  window.addEventListener('route-end', (event) => {
    console.log('Navigation complete:', event.detail);
  });
  ```

- **`route-error`** - Navigation fails
  ```typescript
  window.addEventListener('route-error', (event) => {
    console.error('Route error:', event.detail);
  });
  ```

## Advanced Examples

### Error Handling

```typescript
// Custom error handling
window.addEventListener('route-error', (event) => {
  const error = event.detail;
  console.error(`Route error (${error.code}):`, error.message);
  
  // Show user-friendly error message
  if (error.code === '404') {
    showNotification('Page not found');
  } else {
    showNotification('Navigation failed');
  }
});
```

### Dynamic Route Registration

```typescript
const router = new Router({
  root: document.getElementById('app')!,
  routes: [
    {
      path: '/',
      element: 'home-page'
    }
  ]
});

// Add routes dynamically by reconstructing the router
function addRoute(newRoute: RouteConfig) {
  const newRoutes = [...router.routes, newRoute];
  return new Router({
    root: router.root,
    basepath: router.basepath,
    routes: newRoutes
  });
}
```

### Progressive Enhancement

```typescript
// Check if URLPattern is supported
if ('URLPattern' in window) {
  // Use the router
  const router = new Router({ /* config */ });
  router.go(window.location.href);
} else {
  // Fallback to traditional navigation
  console.warn('URLPattern not supported, using traditional navigation');
}
```

### Performance Optimization

```typescript
// Lazy load route components
const routes = [
  {
    path: '/dashboard',
    loader: async () => {
      // Dynamically import the component
      const module = await import('./pages/DashboardPage.js');
      return { component: module.DashboardPage };
    }
  }
];
```

## Browser Support

- **URLPattern API**: Required for routing functionality
- **Modern browsers**: Chrome 95+, Firefox 106+, Safari 16.4+
- **Polyfill**: Consider using [urlpattern-polyfill](https://www.npmjs.com/package/urlpattern-polyfill) for older browsers

## Migration Guide

### From v0.1.x to v0.2.x

- Removed `connect()` and `disconnect()` methods
- Navigation now starts with `router.go()` instead of `router.connect()`
- Event names changed from `route-change` to `route-start`/`route-end`
- Simplified component exports - use `UOutlet`/`Outlet` and `ULink`/`Link`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.
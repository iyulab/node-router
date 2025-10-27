# @iyulab/router

A modern client-side router for web applications with support for Lit and React components.

## Features

- 🚀 Modern URLPattern-based routing
- 🔧 Support for both Lit and React components
- 📱 Client-side navigation with history management
- 🎯 Nested routing support
- ⚡ Async data loading with loaders
- 🔗 Smart link component with external link detection
- 📊 Route progress tracking
- 🎨 Flexible outlet system for component rendering
- 🌐 Global route information access via `window.route`

## Installation

```bash
npm install @iyulab/router
```

## Usage

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
  ],
  notfound: 'not-found-page'
});

// Connect the router
router.connect();
```

### Using with Lit Components

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { UOutlet, ULink } from '@iyulab/router';

@customElement('app-root')
export class AppRoot extends LitElement {
  render() {
    return html`
      <nav>
        <u-link href="/">Home</u-link>
        <u-link href="/about">About</u-link>
        <u-link href="/user/123">User</u-link>
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
        <Link href="/user/123">User</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

### Nested Routes

```typescript
const routes = [
  {
    path: '/dashboard',
    element: 'dashboard-layout',
    children: [
      {
        index: true,
        element: 'dashboard-home'
      },
      {
        path: 'settings',
        element: 'dashboard-settings'
      },
      {
        path: 'profile',
        component: ProfileComponent
      }
    ]
  }
];
```

### Route Information Access

You can access current route information globally via `window.route`:

```typescript
// In any component or script
console.log('Current path:', window.route.pathname);
console.log('Route params:', window.route.params);
console.log('Query params:', window.route.search);
console.log('Route data:', window.route.data);

// For Lit components
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('my-component')
export class MyComponent extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    // Listen for route changes
    document.addEventListener('route-change', this.onRouteChange);
  }

  disconnectedCallback() {
    document.removeEventListener('route-change', this.onRouteChange);
    super.disconnectedCallback();
  }

  private onRouteChange = () => {
    this.requestUpdate(); // Trigger re-render when route changes
  };

  render() {
    return html`
      <div>Current path: ${window.route?.pathname}</div>
      <div>Params: ${JSON.stringify(window.route?.params)}</div>
    `;
  }
}

// For React components
import React, { useState, useEffect } from 'react';

export function MyReactComponent() {
  const [routeInfo, setRouteInfo] = useState(window.route);

  useEffect(() => {
    const handleRouteChange = () => {
      setRouteInfo(window.route);
    };

    document.addEventListener('route-change', handleRouteChange);
    return () => document.removeEventListener('route-change', handleRouteChange);
  }, []);

  return (
    <div>
      <div>Current path: {routeInfo?.pathname}</div>
      <div>Params: {JSON.stringify(routeInfo?.params)}</div>
    </div>
  );
}
```

## API Reference

### Router

#### Constructor Options

- `root`: HTMLElement - The root element where the router will render components
- `basepath`: string - The base path for the router (optional, defaults to '/')
- `routes`: Route[] - Array of route configurations
- `notfound`: LitElement class or string - Component to render when no route matches

#### Methods

- `connect()`: Connect the router and start listening to navigation events
- `disconnect()`: Disconnect the router and stop listening to events
- `go(href: string)`: Navigate to a specific path
- `goBase()`: Navigate to the base path

### Route Configuration

```typescript
type Route = {
  path?: string;           // URL pattern (URLPattern syntax)
  index?: boolean;         // Index route (matches parent path exactly)
  element?: typeof LitElement | string;  // Lit element to render
  component?: ComponentType;             // React component to render
  loader?: (routeInfo: RouteInfo) => Promise<any>;  // Data loader function
  title?: string;          // Page title
  children?: Route[];      // Nested routes
  force?: boolean;         // Force re-render on navigation
};
```

### Components

- `UOutlet` / `Outlet`: Outlet component for rendering route components
- `ULink` / `Link`: Smart link component with client-side navigation

### Global Route Access

- `window.route`: Global access to current route information (RouteInfo object)

## Events

The router dispatches the following events:

- `route-change`: Fired when the route changes (detail contains RouteInfo)
- `route-progress`: Fired during navigation with progress value (0-1)

## License

MIT
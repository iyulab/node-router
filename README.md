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

```typescript
import { LitChannel, ReactChannel } from '@iyulab/router';

// For Lit components
export class MyLitComponent extends LitChannel {
  render() {
    return html`
      <div>Current path: ${this.routeInfo?.pathname}</div>
      <div>Params: ${JSON.stringify(this.routeInfo?.params)}</div>
    `;
  }
}

// For React components
const MyReactComponent = ReactChannel((routeInfo) => {
  return (
    <div>
      <div>Current path: {routeInfo?.pathname}</div>
      <div>Params: {JSON.stringify(routeInfo?.params)}</div>
    </div>
  );
});
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
- `LitChannel`: Base class for Lit components to access route information
- `ReactChannel`: HOC for React components to access route information

## Events

The router dispatches the following events:

- `route-change`: Fired when the route changes (detail contains RouteInfo)
- `route-progress`: Fired during navigation with progress value (0-1)

## License

MIT
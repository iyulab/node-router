# @iyulab/router

A modern, lightweight client-side router for web applications with support for both Lit and React components.

## Features

- 🚀 **Modern URLPattern-based routing** - Uses native URLPattern API for powerful path matching
- 🔧 **Unified Framework Support** - Works with both Lit and React components using render functions
- 📱 **Client-side Navigation** - History API integration with browser back/forward support
- 🎯 **Nested Routing** - Support for deeply nested route hierarchies with index and path routes
- 🔗 **Smart Link Component** - Automatic external link detection and handling
- 📊 **Route Events** - Track navigation progress with route-begin, route-done, and route-error events
- 🎨 **Flexible Outlet System** - Unified rendering with renderContent method
- 🌐 **Global Route Access** - Access current route information anywhere via `window.route`
- 🔄 **Force Re-rendering** - Control component re-rendering on route changes
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
  root: document.getElementById('app')!,
  basepath: '/app',
  routes: [
    {
      index: true,
      render: () => html`<home-page></home-page>`
    },
    {
      path: '/user/:id',
      render: (routeInfo) => html`<user-page .userId=${routeInfo.params.id}></user-page>`
    }
  ]
});

// Start routing
router.go(window.location.href);
```

### Nested Routes

```typescript
const routes = [
  {
    path: '/dashboard',
    render: () => html`<dashboard-layout><u-outlet></u-outlet></dashboard-layout>`,
    children: [
      {
        index: true, // Matches /dashboard exactly
        render: () => html`<dashboard-home></dashboard-home>`
      },
      {
        path: 'settings',
        render: () => html`<dashboard-settings></dashboard-settings>`
      }
    ]
  }
];
```

### Mixed Framework Support

```typescript
import React from 'react';

const routes = [
  // Lit component
  {
    path: '/lit-page',
    render: (routeInfo) => html`<my-lit-component .routeInfo=${routeInfo}></my-lit-component>`
  },
  // React component
  {
    path: '/react-page',
    render: (routeInfo) => React.createElement(MyReactComponent, { routeInfo })
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

## License

MIT License - see [LICENSE](LICENSE) file for details.
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

## License

MIT License - see [LICENSE](LICENSE) file for details.

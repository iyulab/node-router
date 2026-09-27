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

> The router renders matched output into a `<u-outlet>` inside `root`. Make sure one exists:
>
> ```html
> <div id="app"><u-outlet></u-outlet></div>
> ```
>
> If `root` contains no `<u-outlet>`, the router logs
> `Router initialization failed: Timed out waiting for <u-outlet>` and renders nothing.

## React + Vite

The outlet renders React content by dynamically importing `react-dom/client` when a route
returns a React element. Under Vite's dev pre-bundling (`optimizeDeps`), this CommonJS
interop can break — `TypeError: createRoot is not a function` by default, or
`ReferenceError: module is not defined` if only the router is excluded. Pre-bundle
`react-dom/client` while leaving the router itself unbundled:

```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@iyulab/router'],
    include: ['react-dom/client'],
  },
});
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

## Outlet Layout

`<u-outlet>` has **no box of its own**: it is a mount point, and a route's screen lays out as
if it were a direct child of the element that contains the outlet. The rule is adopted on
whichever tree the outlet is connected to (the document, or the shadow root if it lives in one):

```css
:where(u-outlet) { display: contents; }
```

That is what makes all three kinds of screen behave in a sized, scrolling container (an app
shell's content area) — each measured in a real engine:

| Screen | What it needs | With `contents` |
|---|---|---|
| **Fills the area** — `height: 100%`, a layout that stretches to the viewport | the parent's height, passed down | resolves against the parent directly |
| **Fills the area with more content than fits** — a table with `flex: 1; min-height: 0` holding more rows than the viewport | the parent's height, **not** its own content height | the table scrolls inside itself |
| **Flows** — a form or document taller than the area | to grow, with the container scrolling | the container scrolls, and its end padding stays at the end of the scroll |

Any box in between breaks one of them. A box with `height: 100%` pins itself to the parent, so
a flowing screen overflows it and the scroll container's end padding — added after its in-flow
children, not after what they overflow with — drops out: scrolled to the bottom, the content
sits flush on the edge. A grid box with `min-height: 100%` grows with a flowing screen, but a
grid track is sized from its item's content, and during that sizing the item's `height: 100%`
counts as `auto` — so a filling screen with many rows grows the track to every row and the
table never scrolls. A block or flex box with `min-height: 100%` leaves a descendant's
`height: 100%` with nothing definite to resolve against.

Consequences of having no box:

- CSS that needs a box — `padding`, `background`, `border` — does nothing on `u-outlet`, and
  `getBoundingClientRect()` on it returns zeros. Style the element that contains the outlet,
  or the screen itself.
- In print media there is no box to trap the bottom margin of a screen's last block, so it
  collapses to the end of the document and no trailing blank page appears.

### Overriding it

The `:where()` wrapper makes the rule's specificity zero, so **any** `u-outlet { … }` rule your
application writes wins, regardless of sheet order and without `!important`:

```css
u-outlet { display: block; }                   /* give the outlet a box again */
u-outlet { display: block; height: 100%; }     /* the 0.14.0 behavior */
u-outlet { display: grid; grid-template-columns: minmax(0, 1fr); min-height: 100%; }  /* the 0.15.x behavior */
```


`<u-link>` supports `href`, `target`, `rel`, and `navigate`.

```html
<u-link href="/docs">Docs</u-link>
<u-link href="https://example.com" target="_blank" rel="noopener noreferrer">External</u-link>
```

### Linking to a path the router does not own

Not every path on your origin is a SPA route. A static docs site, a server-rendered
page, a report endpoint, an auth redirect — these live alongside your routes and must
open as documents, in the same tab. Declare that with `navigate="document"`:

```html
<u-link href="/help/" navigate="document">Help</u-link>
```

The router leaves the click alone and the browser navigates normally. The same works
on a plain anchor via `data-navigate="document"`, which is what the element renders.

`navigate` defaults to `router`: same-origin links are handled as SPA navigation, as
before. Note that `navigate` asks a different question than the automatic origin check
— not *"is this another origin?"* but *"is this another document?"* Without it the only
escapes were a different origin, `target="_blank"` (which forces a new tab), or a `#`
fragment (which is not another document at all).

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

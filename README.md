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

`<u-outlet>` declares its own box model. A custom element's UA default is `inline`, which
would put a route's block-level screen inside an inline box — so the outlet adopts its
rules on whichever tree it is connected to (the document, or the shadow root if it lives in
one):

```css
:where(u-outlet) { display: grid; min-height: 100%; }
@media print { :where(u-outlet) { display: block; } }
```

The outlet has to be two things at once, and no single declaration gives both:

1. **It passes a sized parent's height down**, so a screen's `height: 100%` resolves here.
2. **It grows with a screen taller than the parent**, so the overflow stays inside the
   outlet's box rather than escaping it.

`height: 100%` gives only the first. It pins the outlet to the parent's height, so a taller
screen overflows the outlet — and a scrolling ancestor adds its end padding to the scrollable
area of its in-flow children, not of what those children overflow with. The end gutter drops
out: scrolling to the bottom of a long screen leaves the content flush against the container's
edge while the gutter survives on the other three sides.

`min-height: 100%` alone breaks the first. A percentage height only resolves against a parent
whose `height` is specified, and a minimum does not satisfy that — so on a block (or flex) box
a descendant's `height: 100%` computes to `auto` and every fill-the-viewport layout collapses
to its content height.

A grid container gives both. A grid item stretches to its area by default, which fills without
resolving a percentage, so the chain survives while the container's own height is indefinite —
and because that height is `auto`, the box grows past the minimum when content demands it.
Multiple children are unaffected: a track stretches, but an item with a definite height does not.

The rule deliberately omits `align-content`; it relies on the initial `normal`. Setting
`align-content: start` stops the track from stretching and silently voids case 1.

When the parent's own height is `auto`, `min-height: 100%` resolves to `auto` too, so ordinary
document flow is unaffected.

### Printing

In print media the outlet is a plain block box instead of a grid container. A grid container is
an independent formatting context, so the bottom margin of a screen's last block cannot collapse
through it — the margin lands *inside* the outlet's box and adds to its height. On screen that is
harmless. On paper it is not: when content ends within that margin of a page boundary, the box
spills onto a new page that holds nothing but the margin. As a block box, the outlet lets the
margin collapse past it to the end of the document, and a margin that meets a page break is
truncated there, so no trailing blank page appears.

Print loses nothing by this. The grid exists to pass a *sized* parent's height down, and an
application shell normally sizes itself to the viewport only for screen media; in print the
parent's height is `auto`, and `min-height: 100%` resolves to nothing.

### Overriding it

The `:where()` wrapper makes both rules' specificity zero, so **any** `u-outlet { … }` rule your
application writes wins, regardless of sheet order and without `!important`:

```css
u-outlet { display: flex; }                    /* wins */
u-outlet { display: contents; }                /* remove the box entirely */
u-outlet { display: block; height: 100%; }     /* restores the 0.14.0 behavior */
u-outlet { display: inline; }                  /* restores the pre-0.14.0 behavior */
@media print { u-outlet { display: grid; } }  /* restores the 0.15.0 print behavior */
```

> **Making the outlet *smaller* takes two declarations, not one.** `min-height` is a floor, so
> `u-outlet { height: 200px }` on its own still measures the parent's height. Write
> `u-outlet { min-height: 0; height: 200px }`. Making it *larger*, or replacing `display`, needs
> nothing extra. This is the only contract addition in 0.15.0.


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

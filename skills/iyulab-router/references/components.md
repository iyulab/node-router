# Components

## Lit Usage

```ts
import '@iyulab/router';
import { html } from 'lit';

html`
  <nav>
    <u-link href="/">Home</u-link>
    <u-link href="/docs">Docs</u-link>
    <u-link href="https://example.com" target="_blank" rel="noopener noreferrer">External</u-link>
  </nav>
  <main>
    <u-outlet></u-outlet>
  </main>
`;
```

## React Wrappers

```tsx
import { ULink, UOutlet } from '@iyulab/router/react';

export function AppRoot() {
  return (
    <div>
      <nav>
        <ULink href="/">Home</ULink>
        <ULink href="/about">About</ULink>
      </nav>
      <main>
        <UOutlet />
      </main>
    </div>
  );
}
```

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


## Nested Outlet Rule

A parent route must render `<u-outlet>` to host child route content.

## Default Error Page Styling

`Router` renders `<u-error-page>` internally when a route fails and no custom
`fallback` was configured. It is not exported for direct import, but three CSS
custom properties are available to lightly restyle it without replacing
`fallback.render` entirely:

| Custom Property | Description | Default (light) | Default (dark) |
| --- | --- | --- | --- |
| `--error-icon-color` | Icon color | `#4a5568` | `#a0aec0` |
| `--error-code-color` | Error code text color | `#1a202c` | `#f7fafc` |
| `--error-message-color` | Error message text color | `#718096` | `#cbd5e0` |

The defaults are concrete colors set on `:host`, not inherited — the dark column applies
under `prefers-color-scheme: dark`. Because they are literals rather than design tokens,
this page does not follow a host application's theme; set the three properties (or supply
your own `fallback.render`) if it has to.

```css
u-error-page {
  --error-icon-color: #b91c1c;
  --error-code-color: #b91c1c;
}
```

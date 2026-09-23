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

`<u-outlet>` declares its own box model. A custom element's UA default is `inline`, which
would put a route's block-level screen inside an inline box — so the outlet adopts its
rules on whichever tree it is connected to (the document, or the shadow root if it lives in
one):

```css
:where(u-outlet) { display: grid; grid-template-columns: minmax(0, 1fr); min-height: 100%; }
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

The column track is bound to the outlet's width with `minmax(0, 1fr)`. Without it the implicit
column is `auto`, and a grid item's default `min-width: auto` passes its content's minimum width up
to the track — so a wide table inside a screen widened the whole screen past the outlet, even when
the table sat in an `overflow-x: auto` box, and anything aligned to the screen's right edge (a
toolbar's last button) ended up off screen. With the track bound, the screen is exactly as wide as
the outlet, a narrow screen still fills it, and wide content scrolls inside its own box.

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
u-outlet { grid-template-columns: auto; }      /* restores the 0.15.1 column track */
u-outlet { display: contents; }                /* remove the box entirely */
u-outlet { display: block; height: 100%; }     /* restores the 0.14.0 behavior */
u-outlet { display: inline; }                  /* restores the pre-0.14.0 behavior */
@media print { u-outlet { display: grid; } }  /* restores the 0.15.0 print behavior */
```

> **Making the outlet *smaller* takes two declarations, not one.** `min-height` is a floor, so
> `u-outlet { height: 200px }` on its own still measures the parent's height. Write
> `u-outlet { min-height: 0; height: 200px }`. Making it *larger*, or replacing `display`, needs
> nothing extra. This is the only contract addition in 0.15.0.



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

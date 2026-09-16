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

`<u-outlet>` declares its own `display: block`. A custom element's UA default is
`inline`, which would put a route's block-level screen inside an inline box — so the
outlet adopts a single rule on whichever tree it is connected to (the document, or the
shadow root if it lives in one):

```css
:where(u-outlet) { display: block; height: 100%; }
```

`height: 100%` is part of the same rule for a reason. A percentage height resolves against
the nearest block container, so making the outlet a block moves that reference from the box
*above* the outlet onto the outlet itself — and an `auto` height there voids the percentage
silently, collapsing a full-height screen to its content height. Declaring `height: 100%`
keeps the chain intact, and resolves to `auto` whenever the parent's height is `auto`, so
ordinary document flow and printing are unaffected.

The `:where()` wrapper makes the rule's specificity zero, so **any** `u-outlet { … }`
rule your application writes wins, regardless of sheet order and without `!important`:

```css
u-outlet { display: flex; }          /* wins */
u-outlet { height: auto; }           /* keep the box, drop the fill */
u-outlet { display: inline; }        /* restores the pre-0.14.0 behavior */
@media print { u-outlet { … } }      /* wins */
```

The rule is not media-scoped: the outlet is a block box on screen and in print alike.

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

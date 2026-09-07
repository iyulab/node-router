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

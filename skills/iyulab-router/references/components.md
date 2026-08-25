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

| Custom Property | Description | Default |
| --- | --- | --- |
| `--error-icon-color` | Icon color | none — inherits the ambient text color |
| `--error-code-color` | Error code text color | none — inherits the ambient text color |
| `--error-message-color` | Error message text color | none — inherits the ambient text color |

```css
u-error-page {
  --error-icon-color: #b91c1c;
  --error-code-color: #b91c1c;
}
```

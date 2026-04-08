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

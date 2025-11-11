import { createComponent } from '@lit/react';
import React from 'react';

import { Link } from './Link';
import { Outlet } from './Outlet';

// Define custom elements
customElements.define("u-link", Link);
customElements.define("u-outlet", Outlet);

// React Component Wrappers
const ULink = createComponent({
  react: React,
  tagName: 'u-link',
  elementClass: Link,
});
const UOutlet = createComponent({
  react: React as any,
  tagName: 'u-outlet',
  elementClass: Outlet,
});

export { Link, ULink };
export { Outlet, UOutlet };
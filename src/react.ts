import React from 'react';
import { createComponent } from '@lit/react';

import { ULink as ULinkElement } from './components/ULink.js';
import { UOutlet as UOutletElement } from './components/UOutlet.js';

/**
 * `u-link` 웹 컴포넌트를 React에서 사용할 수 있도록 래핑한 컴포넌트입니다.
 */
export const ULink = createComponent({
  react: React,
  tagName: 'u-link',
  elementClass: ULinkElement,
  events: {}
});

/**
 * `u-outlet` 웹 컴포넌트를 React에서 사용할 수 있도록 래핑한 컴포넌트입니다.
 */
export const UOutlet = createComponent({
  react: React as any,
  tagName: 'u-outlet',
  elementClass: UOutletElement,
  events: {}
});
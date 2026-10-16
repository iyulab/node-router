import React from 'react';
import { createComponent } from '@lit/react';

import { ULink as ULinkElement } from './components/ULink.js';
import { UOutlet as UOutletElement } from './components/UOutlet.js';
import type { SelectionChannel } from './selection.js';

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
  react: React,
  tagName: 'u-outlet',
  elementClass: UOutletElement,
  events: {}
});

/**
 * 선택 채널(`selection()`)을 React 상태로 — 값이 바뀌면 다시 그린다. 이 값으로 시작한 비동기 작업은 `channel.signal` 을
 * 넘겨 늦은 응답을 버린다.
 *
 * ```tsx
 * const order = selection<string>('order', { query: 'order' });
 * const [id, setId] = useSelection(order);
 * ```
 */
export function useSelection<T>(channel: SelectionChannel<T>): [T | undefined, (value: T | undefined) => void] {
  const value = React.useSyncExternalStore(
    (onChange) => channel.subscribe(() => onChange()),
    () => channel.value,
    () => channel.value,
  );
  const set = React.useCallback((next: T | undefined) => channel.set(next), [channel]);
  return [value, set];
}

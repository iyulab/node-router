import type { UOutlet } from "../components/UOutlet";
import { OutletMissingError } from "../types/RouteError";

/** 
 * `u-outlet` 엘리먼트를 찾아 반환합니다. 
 */
export function findOutlet(element: HTMLElement): UOutlet | undefined {
  let outlet: UOutlet | undefined = undefined;

  if (element.shadowRoot) {
    // Shadow DOM에서 찾기
    outlet = element.shadowRoot.querySelector('u-outlet') as UOutlet;
    if (outlet) return outlet;

    for (const child of Array.from(element.shadowRoot.children)) {
      outlet = findOutlet(child as HTMLElement);
      if (outlet) return outlet;
    }
  } else {
    // 일반 DOM에서 찾기
    outlet = element.querySelector('u-outlet') as UOutlet;
    if (outlet) return outlet;

    for (const child of Array.from(element.children)) {
      outlet = findOutlet(child as HTMLElement);
      if (outlet) return outlet;
    }
  }

  // 없으면 undefined 반환
  return undefined;
}

/** 
 * `u-outlet` 엘리먼트를 찾아 반환합니다. 없으면 에러를 던집니다. 
 */
export function findOutletOrThrow(element: HTMLElement): UOutlet {
  const outlet = findOutlet(element);
  if (!outlet) {
    throw new OutletMissingError();
  }
  return outlet;
}

/** 
 * composedPath()/closest를 사용해 이벤트에서 A 태그를 찾아 반환 
 */
export function findAnchorFromEvent(e: Event): HTMLAnchorElement | null {
  // composedPath가 있으면 Shadow DOM 포함해서 탐색
  const targets = e.composedPath() || [];
  if (targets && targets.length) {
    for (const node of targets) {
      if (!(node instanceof Element)) continue;
      if ((node as Element).tagName === 'A') return node as HTMLAnchorElement;
    }
  }

  // fallback: 이벤트 타깃에서 closest 검색
  const tgt = e.target as HTMLElement | null;
  if (!tgt) return null;
  const anchor = tgt.closest('a') as HTMLAnchorElement | null;
  return anchor;
}
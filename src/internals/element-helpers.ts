import type { UOutlet } from "../components/UOutlet";
import { OutletMissingError } from "../types/RouteError";

/** 
 * `u-outlet` 엘리먼트를 찾아 반환합니다. 
 * 
 * @param element 검색을 시작할 HTMLElement
 * @returns 찾은 UOutlet 엘리먼트 또는 undefined
 */
export function findOutlet(element: HTMLElement): UOutlet | undefined {
  if (!element) return undefined;

  // element 자체가 u-outlet인 경우 바로 반환
  if (element.tagName === 'U-OUTLET') return element as UOutlet;

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
 * 
 * @param element 검색을 시작할 HTMLElement
 * @returns 찾은 UOutlet 엘리먼트
 * @throws OutletMissingError `u-outlet` 엘리먼트를 찾지 못한 경우
 */
export function findOutletOrThrow(element: HTMLElement): UOutlet {
  const outlet = findOutlet(element);
  if (!outlet) {
    throw new OutletMissingError();
  }
  return outlet;
}

/** 
 * 주어진 엘리먼트 내에서 `u-outlet`이 준비될 때까지 대기합니다.
 * 
 * @param element 대기할 엘리먼트
 * @param timeout 타임아웃 시간(밀리초, 기본값: 10_000ms)
 * @returns 준비된 `u-outlet` 엘리먼트
 */
export async function waitOutlet(element: HTMLElement, timeout = 10_000): Promise<UOutlet> {
  const start = performance.now();

  while (performance.now() - start < timeout) {
    const outlet = findOutlet(element);
    if (outlet) return outlet;

    // 다음 체크까지 잠깐 대기
    await new Promise<void>(r => setTimeout(r, 50));
  }

  throw new Error(
    `Timed out waiting for <u-outlet> inside <${element.tagName.toLowerCase()}>. ` +
    `Ensure that the router root element contains a <u-outlet> child.`
  );
}

/** 
 * 이벤트에서 composedPath()/closest를 사용하여 A 태그를 찾아 반환합니다. 
 * 
 * @param event 이벤트 객체
 * @returns 찾은 A 태그 엘리먼트 또는 null
 */
export function findAnchorFrom(event: Event): HTMLAnchorElement | null {
  // composedPath가 있으면 Shadow DOM 포함해서 탐색
  const targets = event.composedPath() || [];
  if (targets && targets.length) {
    for (const node of targets) {
      if (!(node instanceof Element)) continue;
      if ((node as Element).tagName === 'A') return node as HTMLAnchorElement;
    }
  }

  // fallback: 이벤트 타깃에서 closest 검색
  const tgt = event.target as HTMLElement | null;
  if (!tgt) return null;
  return tgt.closest('a') as HTMLAnchorElement | null;
}

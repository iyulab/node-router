import { UOutlet } from "../components/UOutlet";
import { OutletMissingError } from "../types/RouteError";

/** 
 * `u-outlet` 엘리먼트를 찾아 반환합니다. 
 * 
 * @param element 검색을 시작할 HTMLElement
 * @param skip element 자신을 검사에서 제외할지 여부 (기본값: false)
 * @returns 찾은 UOutlet 엘리먼트 또는 undefined
 */
export function findOutlet(element: HTMLElement, skip = false): UOutlet | undefined {
  if (!skip && element instanceof UOutlet) return element;

  // Shadow DOM과 Light DOM 모두 탐색
  const roots = element.shadowRoot
    ? [element.shadowRoot, element]
    : [element];

  for (const root of roots) {
    for (const child of Array.from(root.children)) {
      const result = findOutlet(child as HTMLElement);
      if (result) return result;
    }
  }

  return undefined;
}

/** 
 * `u-outlet` 엘리먼트를 찾아 반환합니다. 없으면 에러를 던집니다. 
 * 
 * @param element 검색을 시작할 HTMLElement
 * @param skip element 자신을 검사에서 제외할지 여부 (기본값: false)
 * 
 * @returns 찾은 UOutlet 엘리먼트
 * @throws OutletMissingError `u-outlet` 엘리먼트를 찾지 못한 경우
 */
export function findOutletOrThrow(element: HTMLElement, skip = false): UOutlet {
  const outlet = findOutlet(element, skip);
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
 * @param skip element 자신을 검사에서 제외할지 여부 (기본값: false)
 * 
 * @returns 준비된 `u-outlet` 엘리먼트
 */
export async function waitOutlet(element: HTMLElement, timeout = 10_000, skip = false): Promise<UOutlet> {
  const start = performance.now();
  const deadline = start + timeout;

  while (performance.now() < deadline) {
    const outlet = findOutlet(element, skip);
    if (outlet) return outlet;

    // 커스텀 엘리먼트 정의 완료 대기
    if (element.localName.includes('-')) {
      await customElements.whenDefined(element.localName);
    }

    // Lit 계열 updateComplete 대기
    if ('updateComplete' in element) {
      await (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    }

    // DOM 연결/렌더 반영을 위해 다음 프레임까지 대기.
    //
    // 완전히 suspend된(백그라운드) 탭에서는 requestAnimationFrame이 영원히 발화하지
    // 않을 수 있다 — rAF에만 의존하면 이 while 루프 자체를 못 빠져나온다(performance.now()
    // 재평가가 rAF resolve 이후에만 일어나므로). 남은 시간으로 만든 타이머와 경합시켜
    // 루프가 항상 빠져나오도록 한다(setTimeout은 백그라운드에서도 스로틀만 될 뿐 rAF처럼
    // 완전히 멈추지 않는다).
    const remaining = deadline - performance.now();
    if (remaining <= 0) break;
    await Promise.race([
      new Promise<void>(resolve => requestAnimationFrame(() => resolve())),
      new Promise<void>(resolve => setTimeout(resolve, remaining)),
    ]);
  }

  // 루프를 막 빠져나온 프레임에 아웃렛이 이미 준비됐을 수 있다 — 마지막 재확인 없이
  // 곧장 throw하면 그 경쟁 상태에서 오탐(false timeout)이 난다.
  const outlet = findOutlet(element, skip);
  if (outlet) return outlet;

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

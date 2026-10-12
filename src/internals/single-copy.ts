/**
 * 이 패키지의 커스텀 엘리먼트 이름이 아직 비어 있는가 — 등록(`customElements.define`) 바로 앞에서 부른다.
 *
 * 이미 정의돼 있으면 원인을 말하는 오류로 멈춘다. 대개 이 패키지의 사본이 둘 실린 것이다 — 그러면 링크·아웃렛·선택 채널이
 * 한 라우터를 함께 보지 못하는데, 브라우저의 기본 오류(«이름이 이미 쓰였다»)는 그 원인을 말하지 않는다.
 * 등록 호출 자체는 각 모듈에 리터럴로 남긴다 — 등록을 찾는 도구(번들러의 부수효과 판정 · 이 리포의 검사)가 그 모양을 읽는다.
 */
export function assertNotDefined(name: string): void {
  if (!customElements.get(name)) return;
  throw new Error(
    `<${name}> is already defined by a different class. If it comes from another copy of @iyulab/router, ` +
    `two copies are loaded and links, outlets and selection channels will not share one router. ` +
    `\`npm ls @iyulab/router\` should list a single version; if it lists two, remove the older entries ` +
    `from the lockfile and node_modules, then install again.`,
  );
}

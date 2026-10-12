/**
 * 이 패키지의 커스텀 엘리먼트를 등록합니다.
 *
 * - 같은 이름이 같은 생성자로 이미 등록돼 있으면 아무 일도 하지 않습니다.
 * - 같은 이름이 **다른** 생성자로 이미 등록돼 있으면 원인을 말하는 오류로 멈춥니다.
 *   대개 이 패키지의 사본이 둘 실린 것입니다 — 그러면 링크·아웃렛·선택 채널이 한 라우터를
 *   함께 보지 못하는데, 브라우저의 기본 오류(«이름이 이미 쓰였다»)는 그 원인을 말하지 않습니다.
 */
export function defineElement(name: string, ctor: CustomElementConstructor): void {
  const existing = customElements.get(name);
  if (existing === ctor) return;
  if (existing) {
    throw new Error(
      `<${name}> is already defined by a different class. If it comes from another copy of @iyulab/router, ` +
      `two copies are loaded and links, outlets and selection channels will not share one router. ` +
      `\`npm ls @iyulab/router\` should list a single version; if it lists two, remove the older entries ` +
      `from the lockfile and node_modules, then install again.`,
    );
  }
  customElements.define(name, ctor);
}

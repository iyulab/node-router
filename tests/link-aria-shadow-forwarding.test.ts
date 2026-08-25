// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import '../src/components/ULink.js';

/**
 * `<u-link aria-current="page">`/`aria-label="..."`는 호스트 속성으로는 정확히
 * 붙지만, 실제 접근성 트리에 노출되는 노드는 호스트가 아니라 shadow DOM 안의
 * 네이티브 `<a>`다 — 섀도우 경계를 넘지 않으므로 호스트의 속성은 스크린리더에
 * 닿지 않았다(docket #45 실측, Playwright 접근성 스냅샷으로 재현: `<u-link
 * aria-current="page">`는 세팅되지만 실제 링크 노드의 aria-current는 계속 비어
 * 있었음 — `SidebarLink`가 `selected`일 때 `<u-link>` 호스트에 세팅하는 값이다).
 * `render()`가 이제 호스트의 `aria-current`/`aria-label`을 읽어 내부 네이티브
 * `<a>`에 직접 옮긴다.
 */
describe('u-link aria shadow forwarding', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  async function mount(attrs: Record<string, string> = {}): Promise<HTMLElement> {
    const el = document.createElement('u-link');
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    document.body.appendChild(el);
    await (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    return el;
  }

  it('호스트의 aria-current가 내부 네이티브 <a>에 그대로 옮겨진다', async () => {
    const el = await mount({ 'aria-current': 'page', href: '/home' });
    const inner = el.shadowRoot!.querySelector('a');
    expect(inner).not.toBeNull();
    expect(inner!.getAttribute('aria-current')).toBe('page');
  });

  it('호스트의 aria-label도 함께 옮겨진다', async () => {
    const el = await mount({ 'aria-label': '주 메뉴', href: '/home' });
    const inner = el.shadowRoot!.querySelector('a');
    expect(inner!.getAttribute('aria-label')).toBe('주 메뉴');
  });

  it('미지정 시 내부 <a>에 빈 aria-current 속성을 만들지 않는다', async () => {
    const el = await mount({ href: '/home' });
    const inner = el.shadowRoot!.querySelector('a');
    expect(inner!.hasAttribute('aria-current')).toBe(false);
  });

  it('selected 토글처럼 연결 후 aria-current를 세팅/해제해도 반영된다', async () => {
    const el = await mount({ href: '/home' }) as HTMLElement & { updateComplete: Promise<unknown> };
    const inner = () => el.shadowRoot!.querySelector('a')!;

    el.setAttribute('aria-current', 'page');
    await el.updateComplete;
    expect(inner().getAttribute('aria-current')).toBe('page');

    el.removeAttribute('aria-current');
    await el.updateComplete;
    expect(inner().hasAttribute('aria-current')).toBe(false);
  });
});

/**
 * go() 메서드에 전달할 네비게이션 옵션
 */
export interface NavigateOptions {
  /**
   * 리다이렉트로 인한 네비게이션 여부.
   * - `true`이면 히스토리에 새 항목을 추가하지 않고 현재 항목을 교체합니다(replaceState).
   * - 뒤로가기 버튼이 리다이렉트 경유지를 건너뛰게 됩니다.
   * - 리다이렉트 사이클 감지에 사용됩니다.
   * @default false
   */
  isRedirect?: boolean;

  /**
   * 히스토리에 새 항목을 추가하지 않고 현재 항목을 교체합니다(replaceState).
   * - `isRedirect`와 달리 리다이렉트 체인 추적에는 영향을 주지 않습니다.
   * @default false
   */
  replace?: boolean;

  /**
   * pushState / replaceState 호출 시 함께 저장할 커스텀 상태 객체.
   * - `history.state`로 다시 읽을 수 있습니다.
   * @example { from: '/login', referrer: 'email-link' }
   */
  state?: Record<string, unknown>;
}

/**
 * 랜덤한 ID를 생성합니다.
 * - https일 경우 crypto.randomUUID()를 사용합니다.
 * - 그 외의 경우 crypto.getRandomValues()를 사용합니다.
 */
export function getRandomID() {
  return window.isSecureContext
  ? window.crypto.randomUUID()
  : window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
}
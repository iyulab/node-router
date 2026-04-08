const LS_KEY_AUTH = 'test_auth';
const LS_KEY_ROLE = 'test_role';

/**
 * localStorage 기반 인증 상태 — 탭 간 sync를 위해 사용합니다.
 * 직접 프로퍼티로 접근/변경하면 localStorage에 즉시 반영됩니다.
 */
export const auth = {
  get isAuthenticated(): boolean {
    return localStorage.getItem(LS_KEY_AUTH) === 'true';
  },
  set isAuthenticated(value: boolean) {
    localStorage.setItem(LS_KEY_AUTH, String(value));
  },

  get role(): 'user' | 'admin' {
    return (localStorage.getItem(LS_KEY_ROLE) as 'user' | 'admin') ?? 'user';
  },
  set role(value: 'user' | 'admin') {
    localStorage.setItem(LS_KEY_ROLE, value);
  },
};

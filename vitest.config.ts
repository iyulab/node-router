import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// 테스트 전용 설정. `vite.config.ts` 의 빌드 플러그인(`vite-plugin-dts`)을 로드하지
// 않도록 분리한다 — 테스트 실행이 `dist/` 를 건드리는 부작용을 막기 위함이다.
// (modern-app·components 가 같은 이유로 같은 구조를 쓴다.)
//
// - unit:    기존 tests/*.test.ts. 파일 상단의 `// @vitest-environment happy-dom`
//            docblock 이 그대로 유효하다(전 파일이 그것을 갖고 있다).
// - browser: **실제 렌더에서만 드러나는 것**. 이 패키지가 게시하는 두 커스텀 엘리먼트의
//            계약 중 일부는 «상자 모델» 이고, happy-dom 은 레이아웃을 계산하지 않아
//            원리적으로 답을 줄 수 없다 — 유닛 테스트는 «규칙이 시트에 실렸는가» 까지만
//            말할 수 있고 «그래서 어떻게 배치되는가» 는 말하지 못한다. 그 간극에서 실제로
//            회귀가 났다(cycle-628: `display:block` 단독이 자손의 백분율 높이를 무효화).
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/browser/**'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
          // 고정 포트 이유는 packages/components/vitest.config.ts 참조 —
          // 이 머신의 Windows 동적 포트 제외 범위와 vitest 기본 포트가
          // 충돌해 EACCES 로 실패하던 것을 실측으로 확인했다. 41501~41506 사용 중.
          api: { host: '127.0.0.1', port: 41507 },
          isolate: true,
        },
      },
    ],
  },
});

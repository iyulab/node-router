import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.*']
  },
  {
    // 확장자를 명시해야 .ts 가 린팅 대상으로 opt-in 된다.
    // 확장자 없는 패턴('src/**/*')은 universal 로 취급돼 어떤 파일도 매칭하지 않는다.
    files: ['src/**/*.ts'],
    // 프리셋은 extends 로 합성한다. 객체 스프레드({...preset})는 배열 프리셋
    // (tseslint.configs.recommended)을 인덱스 키로 뭉개 무력화시킨다.
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended
    ],
    languageOptions: {
      sourceType: 'module',
      globals: globals.browser
    },
    // 게시되는 React 래퍼(`react.ts`)의 훅 규칙. 훅이 없는 파일에서는 발화하지 않으므로 대상을 열거하지 않고 src 전체에 건다.
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      // 라이브러리는 조용해야 하지만, 삼켜질 오류를 알리는 진단은 정당하다.
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  }
]);

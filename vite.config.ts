import { defineConfig, PluginOption } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { readFileSync, writeFileSync } from 'fs';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Router',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? `main.js` :`main.${format}.js`,
    },
    rollupOptions: {
      external: [
        /^lit.*/,
        /^@lit.*/,
        /^react.*/,
      ]
    },
  },
  plugins: [
    dts({
      outDir: 'dist',
      tsconfigPath: resolve(__dirname, 'tsconfig.json'),
      insertTypesEntry: true,
      rollupTypes: true,
      afterBuild: () => {
        try {
          // global.d.ts의 전역 선언을 main.d.ts에 추가
          const globalDtsPath = resolve(__dirname, 'src/global.d.ts');
          const mainDtsPath = resolve(__dirname, 'dist/main.d.ts');

          const globalContent = readFileSync(globalDtsPath, 'utf-8');
          const mainContent = readFileSync(mainDtsPath, 'utf-8');
          
          // 주석 경계로 전역 선언 부분만 추출
          const splitter = '/* === EXTRACT === */';
          const extractedContent = globalContent.split(splitter)[1].trim();

          // main.d.ts 끝에 전역 선언 추가
          const updatedContent = mainContent + '\n' + extractedContent;
          writeFileSync(mainDtsPath, updatedContent, 'utf-8');
        } catch (error) {
          console.error('Failed to add global declarations:', error);
        }
      }
    }) as PluginOption
  ]
});
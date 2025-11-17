import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { readFileSync, writeFileSync } from 'fs';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: (format, entry) => {
        return format === 'es' ? `${entry}.js` : `${entry}.${format}.js`;
      }
    },
    rollupOptions: {
      external: [
        // /^@lit.*/, // @lit/react패키지 빌드에 포함
        /^lit.*/,
        /^react.*/,
      ]
    },
  },
  plugins: [
    dts({
      include: ['src/**/*'],
      rollupTypes: true,
      copyDtsFiles: true,
      afterBuild: () => {
        try {
          // global.d.ts의 전역 선언을 index.d.ts에 추가
          const globalDtsPath = resolve(__dirname, 'src/global.d.ts');
          const mainDtsPath = resolve(__dirname, 'dist/index.d.ts');

          const globalContent = readFileSync(globalDtsPath, 'utf-8');
          const mainContent = readFileSync(mainDtsPath, 'utf-8');
          
          // 주석 경계로 전역 선언 부분만 추출
          const splitter = '/* === EXTRACT === */';
          const extractedContent = globalContent.split(splitter)[1].trim();

          // main.d.ts 끝에 전역 선언 추가
          const updatedContent = mainContent + '\n' + extractedContent;
          writeFileSync(mainDtsPath, updatedContent, 'utf-8');
          console.log('Global declarations added to index.d.ts successfully.');
        } catch (error) {
          console.error('Failed to add global declarations:', error);
        }
      }
    })
  ]
});
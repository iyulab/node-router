import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: [
        resolve(__dirname, 'src/index.ts'), // 메인 엔트리 포인트
        resolve(__dirname, 'src/react.ts'), // React 래퍼 엔트리 포인트
      ],
      formats: ['es'],
      fileName: (format, entry) => {
        return format === 'es' ? `${entry}.js` : `${entry}.${format}.js`;
      }
    },
    rollupOptions: {
      external: [
        /^@lit.*/,
        /^lit.*/,
        /^react.*/,
      ],
      output: {
        // 공유 청크 파일 이름 설정
        chunkFileNames: 'share-[hash].js',
      }
    },
  },
  plugins: [
    dts({
      include: ['src/**/*'],
      bundleTypes: true,
    })
  ]
});
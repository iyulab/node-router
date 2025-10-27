import { defineConfig, PluginOption } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Router',
      formats: ['es', 'cjs'],
      fileName: (format) => `main.${format}.js`,
    },
    rollupOptions: {
      external: [
        /^react.*/,
        /^lit.*/,
        /^@lit.*/,
      ]
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: false
  },
  plugins: [
    dts({
      outDir: 'dist',
      tsconfigPath: resolve(__dirname, 'tsconfig.json'),
      insertTypesEntry: true,
      rollupTypes: true,
    }) as PluginOption
  ]
});
import { defineConfig, PluginOption } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Router',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `main.${format}.js`,
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        'lit', 
        'react', 
        'react-dom',
        '@lit/react'
      ],
      output: {
        globals: {
          'lit': 'Lit',
          'react': 'React',
          'react-dom': 'ReactDOM',
          '@lit/react': 'LitReact'
        }
      }
    },
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
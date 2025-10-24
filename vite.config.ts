import { defineConfig, PluginOption } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'URouter',
      fileName: (format) => {
        switch (format) {
          case 'es':
            return 'index.js';
          case 'cjs':
            return 'index.cjs.js';
          case 'umd':
            return 'index.umd.js';
          default:
            return `index.${format}.js`;
        }
      },
      formats: ['es', 'cjs', 'umd']
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['lit', 'react', 'react-dom', '@lit/react'],
      output: {
        globals: {
          'lit': 'Lit',
          'react': 'React',
          'react-dom': 'ReactDOM',
          '@lit/react': 'LitReact'
        },
        format: 'es',
        compact: false,
        generatedCode: {
          constBindings: true
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
      insertTypesEntry: true,
      rollupTypes: true
    }) as PluginOption
  ]
});
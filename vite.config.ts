import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { risuPluginHeader } from './vite-plugin-risu-header';

export default defineConfig({
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      emitCss: true,
    }),
    cssInjectedByJsPlugin(),
    risuPluginHeader(), // RisuAI 헤더 자동 생성
  ],
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'my-plugin',
      fileName: () => 'my-plugin.js',
      formats: ['umd']
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    },
    cssCodeSplit: false,
    minify: 'terser',
    sourcemap: false
  }
});

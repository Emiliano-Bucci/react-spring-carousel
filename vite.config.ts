import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import tsConfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsConfigPaths(),
    dts({
      outputDir: 'dist/types/',
      insertTypesEntry: true,
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: ['src/useSpringCarousel.tsx', 'src/useTransitionCarousel.tsx', 'src/index.tsx'],
      name: 'react-spring-carousel',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@react-spring/web',
        '@use-gesture/react',
        'resize-observer-polyfill',
        'screenfull',
      ],
    },
  },
})

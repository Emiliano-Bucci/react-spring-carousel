import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as packageJson from './package.json'
import dts from 'vite-plugin-dts'
import tsConfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsConfigPaths(),
    dts({
      include: ['src/**/*'],
    }),
  ],
  build: {
    lib: {
      entry: [
        'src/index.tsx',
        'src/modules/index.tsx',
        'src/useSpringCarousel.tsx',
        'src/useTransitionCarousel.tsx',
      ],
    },
    rollupOptions: {
      external: [
        ...Object.keys(packageJson.dependencies),
        ...Object.keys(packageJson.peerDependencies),
      ],
    },
  },
})

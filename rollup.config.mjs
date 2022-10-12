import babel from 'rollup-plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import external from 'rollup-plugin-peer-deps-external'
import rollupTS from 'rollup-plugin-typescript2'
// import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import pkg from './package.json' assert { type: 'json' }
import size from 'rollup-plugin-filesize'
import excludeDependenciesFromBundle from 'rollup-plugin-exclude-dependencies-from-bundle'

const props = {
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
  plugins: [
    excludeDependenciesFromBundle({
      peerDependencies: true,
    }),
    rollupTS({
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        exclude: ['Examples', 'node_modules'],
        compilerOptions: {
          target: 'ES2015',
          rootDir: './src',
        },
      },
    }),
    babel({
      exclude: 'node_modules/**',
      presets: ['@babel/preset-react'],
    }),
    external(),
    resolve(),
    commonjs(),
    // terser(),
    size(),
  ],
}

export default [
  {
    input: ['src/index.tsx', 'src/modules/index.tsx', 'src/useSpringCarousel.tsx'],
    output: {
      dir: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
    ...props,
  },
  {
    input: 'src/index.tsx',
    output: [
      {
        format: 'cjs',
        file: pkg.main,
        sourcemap: true,
      },
      {
        format: 'umd',
        file: './dist/umd/index.js',
        sourcemap: true,
        name: 'ReactSpringCarousel',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          screenfull: 'Screenfull',
          'react/jsx-runtime': 'ReactJSXRuntime',
          '@react-spring/web': 'ReactSpring',
          '@use-gesture/react': 'UseGestureReact',
        },
      },
    ],
    ...props,
  },
]

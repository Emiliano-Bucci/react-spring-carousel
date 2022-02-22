import babel from 'rollup-plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import external from 'rollup-plugin-peer-deps-external'
import rollupTS from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import pkg from './package.json'
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
      },
    }),
    babel({
      exclude: 'node_modules/**',
      presets: ['@babel/preset-react'],
    }),
    external(),
    resolve(),
    commonjs(),
    terser(),
    size(),
  ],
}

export default {
  input: 'src/index.tsx',
  output: [
    {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
    {
      format: 'cjs',
      file: pkg.main,
      sourcemap: true,
    },
  ],
  ...props,
}

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  'ws',
  'axios',
  'jose',
  'eventemitter3'
];

const plugins = [
  resolve({
    preferBuiltins: true,
    browser: true
  }),
  commonjs(),
  json(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: true,
    declarationDir: 'dist',
    rootDir: 'src'
  })
];

// Production plugins (minification)
const productionPlugins = [
  ...plugins,
  terser({
    compress: {
      drop_console: true,
      drop_debugger: true
    },
    format: {
      comments: false
    }
  })
];

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: pkg.module || 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    external,
    plugins: productionPlugins
  },

  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: pkg.main || 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    external,
    plugins: productionPlugins
  },

  // Browser UMD build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'MariiaHubSDK',
      sourcemap: true,
      globals: {
        'axios': 'axios',
        'jose': 'jose',
        'eventemitter3': 'EventEmitter3'
      }
    },
    external: ['axios', 'jose', 'eventemitter3'],
    plugins: productionPlugins
  },

  // Development builds (unminified)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.dev.esm.js',
      format: 'esm',
      sourcemap: true
    },
    external,
    plugins
  },

  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.dev.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    external,
    plugins
  }
];
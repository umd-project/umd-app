import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: './src/app.js',
  output: {
    file: './dist/app.min.js',
    format: 'es'
  },
  plugins: [nodeResolve(), commonjs(), json()]
};
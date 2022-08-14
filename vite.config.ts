/// <reference types="vitest" />
import fs from 'fs'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json'

export default defineConfig({
  root: '.',
  plugins: [
    dts(),
    () => {
      fs.copyFileSync('README.md', './dist/README.md')
    },
    () => {
      const packageDeployable = {}

      for (const [key, value] of Object.entries(pkg)) {
        if (!['dependencies', 'devDependencies', 'scripts'].includes(key)) {
          packageDeployable[key] = value
        }
      }

      fs.writeFileSync(
        './dist/package.json',
        JSON.stringify(packageDeployable, undefined, 2)
      )
    },
  ],
  build: {
    outDir: 'dist/lib',
    sourcemap: 'inline',
    minify: true,
    lib: {
      entry: 'src/index.ts',
      fileName: '[name]',
      formats: ['cjs'],
    },
  },
  test: {
    globals: true,
  },
})

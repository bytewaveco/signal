import path from 'path'
import { defineConfig } from 'vitest/config'

export const r = (p: string) => path.resolve(__dirname, p)

export default defineConfig({
  resolve: {
    alias: {
      '~': r('./src'),
      '~/*': r('./src/*'),
    },
  },
  test: {
    api: 2999,
    globals: true,
    coverage: {
      provider: 'istanbul',
      exclude: ['**/__mocks__/**'],
    },
  },
})

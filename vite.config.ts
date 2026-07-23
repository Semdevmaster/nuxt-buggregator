import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
  lint: {
    ignorePatterns: ['dist/**', 'playground/.nuxt/**', '**/.nuxt/**'],
  },
  fmt: {
    semi: false,
    singleQuote: true,
    endOfLine: 'lf',
    ignorePatterns: ['package.json', 'package-lock.json', '**/package-lock.json'],
    sortPackageJson: false,
  },
  staged: {
    '*': 'vp check --fix',
  },
})

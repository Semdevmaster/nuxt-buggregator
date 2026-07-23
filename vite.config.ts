import type { OxlintConfig, OxlintOverride } from 'oxlint'
import { defineConfig } from 'vite-plus'

/**
 * Vite+ tooling only (lint / fmt / test / tasks).
 * Nuxt owns Vite for `nuxt dev` / `nuxt build` via playground / fixtures.
 * A root `vite.config.ts` is required by Vite+ (cannot live under `nuxt.config`).
 * @see https://github.com/nuxt/nuxt/discussions/34857
 * @see https://github.com/voidzero-dev/vite-plus/issues/912
 */

const basePlugins = [
  'eslint',
  'typescript',
  'vue',
  'import',
  'unicorn',
  'node',
  'promise',
  'oxc',
] as const

const jsPlugins = [
  { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
  { name: 'nuxt', specifier: '@nuxt/eslint-plugin' },
] as const satisfies NonNullable<OxlintConfig['jsPlugins']>

const lint: OxlintConfig = {
  ignorePatterns: [
    'dist/**',
    'playground/.nuxt/**',
    'playground/.output/**',
    'test/fixtures/**',
    '**/.nuxt/**',
    '**/.output/**',
    'node_modules/**',
  ],
  plugins: [...basePlugins],
  env: {
    browser: true,
    node: true,
    es2024: true,
  },
  globals: {
    $fetch: 'readonly',
    computed: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    defineNuxtConfig: 'readonly',
    defineNuxtPlugin: 'readonly',
    defineEventHandler: 'readonly',
    defineNitroPlugin: 'readonly',
    definePageMeta: 'readonly',
    defineProps: 'readonly',
    navigateTo: 'readonly',
    onMounted: 'readonly',
    onUnmounted: 'readonly',
    reactive: 'readonly',
    readBody: 'readonly',
    ref: 'readonly',
    shallowReactive: 'readonly',
    shallowRef: 'readonly',
    toRef: 'readonly',
    toRefs: 'readonly',
    useAsyncData: 'readonly',
    useFetch: 'readonly',
    useHead: 'readonly',
    useNuxtApp: 'readonly',
    useRoute: 'readonly',
    useRouter: 'readonly',
    useRuntimeConfig: 'readonly',
    useSeoMeta: 'readonly',
    useState: 'readonly',
    watch: 'readonly',
    watchEffect: 'readonly',
  },
  jsPlugins: [...jsPlugins],
  rules: {
    'vite-plus/prefer-vite-plus-imports': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'nuxt/prefer-import-meta': 'error',
    'import/first': 'error',
    'import/no-duplicates': 'error',
    'vue/define-emits-declaration': 'warn',
    'vue/define-props-declaration': 'warn',
    'vue/no-export-in-script-setup': 'error',
    'vue/no-expose-after-await': 'error',
    'vue/no-import-compiler-macros': 'error',
    'vue/no-lifecycle-after-await': 'error',
    'vue/no-reserved-component-names': 'error',
    'vue/no-watch-after-await': 'error',
    'vue/prefer-import-from-vue': 'error',
    'vue/require-default-export': 'error',
    'vue/valid-define-emits': 'error',
    'vue/valid-define-props': 'error',
  },
  overrides: [
    {
      files: [
        'playground/nuxt.config.{js,ts,mjs,cjs}',
        'test/fixtures/**/nuxt.config.{js,ts,mjs,cjs}',
      ],
      rules: {
        'nuxt/no-nuxt-config-test-key': 'error',
        'nuxt/nuxt-config-keys-order': 'warn',
      },
    },
    {
      files: ['**/*.{test,spec}.{js,ts,mjs,cjs}'],
      plugins: [...basePlugins, 'vitest'],
      rules: {
        'no-console': 'off',
      },
    } satisfies OxlintOverride,
  ],
  options: {
    typeAware: true,
    typeCheck: true,
  },
}

export default defineConfig({
  lint,
  fmt: {
    singleQuote: true,
    semi: false,
    printWidth: 100,
    endOfLine: 'lf',
    sortPackageJson: true,
    sortImports: true,
    ignorePatterns: ['package.json', 'bun.lock', '**/package-lock.json'],
  },
  test: {
    include: ['test/**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules/**', '**/.nuxt/**', '**/.output/**', 'dist/**'],
  },
  staged: {
    '*': 'vp check --fix',
  },
  run: {
    tasks: {
      'module:prepare': {
        command: 'bun run dev:prepare',
      },
      'pipeline:validate': {
        command: ['vp check'],
        dependsOn: ['module:prepare'],
      },
      'pipeline:ci': {
        command: ['vp check', 'vp test', 'bun run prepack'],
        dependsOn: ['module:prepare'],
        output: ['dist/**'],
      },
    },
  },
})

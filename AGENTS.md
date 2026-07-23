<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# nuxt-buggregator (Nuxt module)

Nuxt owns **module build** (`nuxt-module-build`), **playground** (`nuxt dev` / `nuxt build`), and **runtime**. Vite+ owns **lint**, **format**, **typecheck**, **test**, and **task orchestration**.

- **Nuxt**: `^4.5.0` (`@nuxt/kit`, `@nuxt/module-builder`).
- **TypeScript 7**: native `tsc` via `@typescript/native` (`npm:typescript@^7`).
- **TypeScript API**: `typescript@~6` (JS Compiler API for `@nuxt/module-builder` / IDE; TS 7.0 has no stable JS API yet).
- **Typecheck**: Vite+ / tsgolint (`vp check`), not `vue-tsc`.
- **Package manager**: Bun (`devEngines.packageManager`).
- **Publishable entry**: `dist/` (`prepack` → `nuxt-module-build build`).

## Config split

| File             | Responsibility                                                         |
| ---------------- | ---------------------------------------------------------------------- |
| `src/module.ts`  | Module setup (`@nuxt/kit`)                                             |
| `src/runtime/**` | Runtime shipped to consumer apps                                       |
| `playground/`    | Local Nuxt app for manual/dev testing                                  |
| `vite.config.ts` | Vite+ only: Oxlint, Oxfmt, Vitest, `run.tasks` — **required** by Vite+ |
| `tsconfig.json`  | Extends `.nuxt/tsconfig.json` from `nuxt-module-build prepare`         |

Do **not** put Oxlint/Oxfmt in `oxlint.config.ts` / `.oxlintrc.json`. Do **not** put Vite+ `lint`/`fmt` under `nuxt.config` `vite`.

## TypeScript & checking

- Types are generated via `bun run dev:prepare` (`nuxt-module-build prepare` + playground prepare).
- **Typecheck** runs through Vite+ (`vp check` / `lint.options.typeCheck`) via tsgolint, not `vue-tsc`.
- `vue-tsc` is intentionally omitted (same as app projects on TS7 + Vite+).
- Side-by-side TS setup: `@typescript/native` = TS7 `tsc`; `typescript@~6` = JS API for tools that `import 'typescript'` (see [TS 7.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)). Bun cannot use the `typescript` → `@typescript/typescript6` alias (circular `@typescript/old`).
- IDE Vue support: `@vue/language-server` + `@vue/typescript-plugin`.

## Commands

| Script                        | Action                                  |
| ----------------------------- | --------------------------------------- |
| `bun run dev`                 | prepare + `nuxt dev playground`         |
| `bun run dev:prepare`         | stub/build types + prepare playground   |
| `bun run prepack`             | build publishable `dist/`               |
| `bun run check` / `check:fix` | `vp check` — Oxfmt + Oxlint + typecheck |
| `bun run lint` / `lint:fix`   | `vp lint`                               |
| `bun run fmt`                 | `vp fmt`                                |
| `bun run test`                | `vp test`                               |
| `bun run typecheck`           | `vp check --no-fmt`                     |
| `bun run validate`            | `dev:prepare` → `vp check`              |

## Generated / ignored

Do not commit: `.nuxt/`, `.output/`, `node_modules/`, `dist/`, `bun.lock` is committed.

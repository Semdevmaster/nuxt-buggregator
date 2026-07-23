# nuxt-buggregator

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Nuxt module for debugging with [Buggregator](https://buggregator.dev) over the Spatie Ray protocol.

Chainable Ray API on the **client** (`useRay` / `$ray`) and **server** (Nitro auto-import `ray()`), with payloads sent through a local Nitro proxy so connection credentials never reach the browser.

## Features

- Spatie-like `ray(...)` API: colors, labels, size, table, json, measure, exception, trace, …
- Client and server share the same proxy endpoint
- `host` / `port` / `scheme` / `project` stay on the server only
- Rich dump of complex values with configurable expand depth (`maxDepth`)

## Quick Setup

Install the module in your Nuxt application:

```bash
npx nuxt module add nuxt-buggregator
```

Or manually:

```bash
npm i nuxt-buggregator
```

```ts
export default defineNuxtConfig({
  modules: ['nuxt-buggregator'],
  buggregator: {
    enabled: true,
    // host / port / scheme / project — or via .env
  },
})
```

## Architecture

Client and server use the same call:

```ts
await $fetch('/api/_buggregator', { method: 'POST', body: envelope })
```

`host` / `port` / `scheme` / `project` and Basic Auth stay on the Nitro proxy:

```
useRay() / $ray  ──┐
                   ├──► $fetch('/api/_buggregator') ──► proxy (+ Basic Auth) ──► Buggregator
ray() (Nitro)   ──┘
```

| Runtime     | Behavior                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| Browser     | Same-origin HTTP to `/api/_buggregator`                                                                |
| Nitro / SSR | [Direct API Call](https://nuxt.com/docs/4.x/guide/concepts/server-engine) — handler invoked in-process |

Locks for `pause()`: `$fetch('/api/_buggregator/locks/:name')`.

## Configuration

| Option     | Default     | Description                                      |
| ---------- | ----------- | ------------------------------------------------ |
| `enabled`  | `true`      | Enable sending                                   |
| `maxDepth` | `3`         | Auto-expand depth for dumped values              |
| `host`     | `127.0.0.1` | Buggregator host (reachable from Nitro)          |
| `port`     | `8000`      | Port                                             |
| `scheme`   | `http`      | `http` \| `https`                                |
| `project`  | `''`        | Project key (Basic Auth password for user `ray`) |

`host`, `port`, `scheme`, and `project` are private runtime config (not sent to the browser).  
`enabled` and `maxDepth` are also available on the public runtime config (needed on the client).

### Environment variables

```env
NUXT_BUGGREGATOR_HOST=127.0.0.1
NUXT_BUGGREGATOR_PORT=8000
NUXT_BUGGREGATOR_SCHEME=http
NUXT_BUGGREGATOR_PROJECT=my-project

# public (client-visible):
NUXT_PUBLIC_BUGGREGATOR_ENABLED=true
NUXT_PUBLIC_BUGGREGATOR_MAX_DEPTH=3
```

Proxy sends `Authorization: Basic base64("ray:" + project)`.

## Usage

### Client / Vue

```vue
<script setup lang="ts">
const ray = useRay()

ray('hello')
ray({ user: 'Semdevmaster', ok: true }).green().label('user')
ray().json(JSON.stringify({ id: 42 }))
ray().toJson({ id: 42 })
</script>
```

Also available as `const { $ray } = useNuxtApp()`.

### Server (Nitro)

```ts
// server/api/example.get.ts
export default defineEventHandler(() => {
  ray('server ping')
  ray({ ok: true, source: 'nitro' }).blue()
  return { ok: true }
})
```

### Common methods

**Output:** `send` / `log`, `raw`, `pass`, `json`, `toJson`, `html`, `text`, `table`, `date`, `error`, `exception`

**Styling (same uuid):** `color` + aliases, `size` + `small` / `large`, `label`, `separator`, `newScreen`, `notify`, `confetti`

**Utilities:** `enable` / `disable`, `if`, `once`, `limit`, `count`, `measure`, `pause`, `caller`, `trace`

```ts
ray('step').green().label('checkout').large()
```

## Requirements

- Nuxt `>= 4`
- Running Buggregator reachable from Nitro at `host:port`

## Contribution

```bash
# Install dependencies (Vite+)
vp install
# or: npm install

# Generate type stubs
npm run dev:prepare

# Develop with the playground
npm run dev

# Format / lint / types (Oxlint + Oxfmt)
vp check

# Tests
vp test

# Build the module
npm run prepack

# Release
npm run release
```

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-buggregator/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-buggregator
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-buggregator.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-buggregator
[license-src]: https://img.shields.io/npm/l/nuxt-buggregator.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-buggregator
[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com

import type { LockStatus, RequestEnvelope, Transport } from './types'

/**
 * Host-app `$fetch` (Nuxt `#build/fetch.mjs` = `globalThis.$fetch`).
 * Nitro sets it via `createFetch({ fetch: localFetch })` — Direct API Calls.
 * Do not `import { $fetch } from 'ofetch'`: that is a plain instance without localFetch.
 *
 * Call signature is untyped on purpose: Nitro's typed-router overloads blow up
 * stack depth when used from a published module's isomorphic core.
 */
function appFetch<T = unknown>(url: string, opts?: Record<string, unknown>): Promise<T> {
  const fetch = globalThis.$fetch as
    | ((input: string, init?: Record<string, unknown>) => Promise<T>)
    | undefined
  if (!fetch) {
    return Promise.reject(new Error('globalThis.$fetch is not available'))
  }
  return fetch(url, opts)
}

export function createFetchTransport(options: { basePath: string }): Transport {
  const { basePath } = options
  const root = basePath.replace(/\/$/, '')

  return {
    async send(envelope: RequestEnvelope): Promise<void> {
      try {
        await appFetch(root, {
          method: 'POST',
          body: envelope,
        })
      } catch {
        // Ray transports swallow network errors by design
      }
    },

    async lockExists(name: string): Promise<LockStatus | false> {
      try {
        const data = await appFetch<LockStatus>(`${root}/locks/${encodeURIComponent(name)}`, {
          method: 'GET',
        })

        if (data?.stop_execution) {
          throw new Error('stopping execution')
        }

        return data
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'stopping execution') {
          throw error
        }
        return false
      }
    },
  }
}

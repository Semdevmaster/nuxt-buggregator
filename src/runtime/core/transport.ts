import { $fetch } from 'ofetch'
import type { LockStatus, RequestEnvelope, Transport } from './types'

/**
 * Isomorphic transport via Nuxt `$fetch` to the local proxy.
 * Client: HTTP same-origin. Server: Nitro Direct API Call (no real HTTP).
 */
export function createFetchTransport(options: { basePath: string }): Transport {
  const { basePath } = options
  const root = basePath.replace(/\/$/, '')

  return {
    async send(envelope: RequestEnvelope): Promise<void> {
      try {
        await $fetch(root, {
          method: 'POST',
          body: envelope,
        })
      } catch {
        // Ray transports swallow network errors by design
      }
    },

    async lockExists(name: string): Promise<LockStatus | false> {
      try {
        const data = await $fetch<LockStatus>(`${root}/locks/${encodeURIComponent(name)}`, {
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

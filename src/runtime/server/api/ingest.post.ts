import { defineEventHandler, readBody } from 'h3'
import { $fetch } from 'ofetch'
import { resolveUpstream, upstreamUrl } from '../utils/upstream'

/**
 * Proxy: POST /api/_buggregator → POST {upstream}/
 * Client and server both `$fetch` here; Nitro short-circuits on the server.
 */
export default defineEventHandler(async (event) => {
  const { config, headers } = resolveUpstream(event)

  if (!config.enabled) {
    return { ok: true, skipped: true }
  }

  const body = await readBody(event)

  try {
    await $fetch(upstreamUrl(config, '/'), {
      method: 'POST',
      body,
      headers,
    })
  } catch {
    // Swallow upstream errors — Ray SDK never fails the app
  }

  return { ok: true }
})

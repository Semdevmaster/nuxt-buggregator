import { createError, defineEventHandler, getRouterParam } from '#imports'

import type { LockStatus } from '../../../core/types'
import { encodePathSegments, resolveUpstream, upstreamUrl } from '../../utils/upstream'

/**
 * Proxy: GET /api/_buggregator/locks/:name → GET {upstream}/locks/:name
 */
export default defineEventHandler(async (event) => {
  const { config, headers } = resolveUpstream(event)
  const raw = getRouterParam(event, 'name')
  const name = Array.isArray(raw) ? raw.join('/') : raw

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'lock name required' })
  }

  if (!config.enabled) {
    return { active: false } satisfies LockStatus
  }

  const path = `/locks/${encodePathSegments(name)}`

  try {
    return await globalThis.$fetch<LockStatus>(upstreamUrl(config, path), {
      method: 'GET',
      headers,
    })
  } catch {
    return { active: false } satisfies LockStatus
  }
})

import type { H3Event } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'

import {
  buggregatorAuthHeader,
  buggregatorUpstreamUrl,
  readServerBuggregatorConfig,
  type BuggregatorEndpointConfig,
} from '../../core/config'

export function resolveUpstream(event: H3Event): {
  config: BuggregatorEndpointConfig
  headers: { Authorization: string }
} {
  const config = readServerBuggregatorConfig(useRuntimeConfig(event))
  return {
    config,
    headers: { Authorization: buggregatorAuthHeader(config.project) },
  }
}

export function upstreamUrl(
  config: Pick<BuggregatorEndpointConfig, 'scheme' | 'host' | 'port'>,
  path: string,
): string {
  return buggregatorUpstreamUrl(config, path)
}

/** Encode each path segment (safe for catch-all lock names). */
export function encodePathSegments(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

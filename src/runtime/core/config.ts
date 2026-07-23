import type { BuggregatorEndpointConfig, BuggregatorPublicConfig, RaySettings } from './types'
import { BUGGREGATOR_PROXY_BASE } from './types'

export type { BuggregatorEndpointConfig, BuggregatorPublicConfig, RaySettings }

const DEFAULT_MAX_DEPTH = 3

export function readPublicBuggregatorConfig(runtimeConfig: {
  public: { buggregator?: Partial<BuggregatorPublicConfig> }
}): BuggregatorPublicConfig {
  const config = runtimeConfig.public.buggregator ?? {}

  return {
    enabled: config.enabled ?? true,
    maxDepth: Number(config.maxDepth ?? DEFAULT_MAX_DEPTH),
  }
}

export function readServerBuggregatorConfig(runtimeConfig: {
  buggregator?: Partial<BuggregatorEndpointConfig>
  public?: { buggregator?: Partial<BuggregatorPublicConfig> }
}): BuggregatorEndpointConfig {
  const server = runtimeConfig.buggregator ?? {}
  const publicPart = runtimeConfig.public?.buggregator ?? {}

  return {
    enabled: server.enabled ?? publicPart.enabled ?? true,
    host: String(server.host ?? '127.0.0.1'),
    port: Number(server.port ?? 8000),
    scheme: String(server.scheme ?? 'http'),
    project: String(server.project ?? ''),
    maxDepth: Number(server.maxDepth ?? publicPart.maxDepth ?? DEFAULT_MAX_DEPTH),
  }
}

/**
 * Buggregator routes Ray by Basic Auth user `ray` (password = project key).
 * Used only by the Nitro proxy handlers — never exposed to the browser.
 */
export function buggregatorAuthHeader(project: string): string {
  const token = `ray:${project}`
  const encoded =
    typeof btoa === 'function' ? btoa(token) : Buffer.from(token, 'utf8').toString('base64')

  return `Basic ${encoded}`
}

export function toRaySettings(
  publicConfig: BuggregatorPublicConfig,
  projectName = '',
  basePath = BUGGREGATOR_PROXY_BASE,
): RaySettings {
  return {
    enabled: publicConfig.enabled,
    maxDepth: publicConfig.maxDepth,
    projectName,
    basePath,
  }
}

export function buggregatorUpstreamUrl(
  config: Pick<BuggregatorEndpointConfig, 'scheme' | 'host' | 'port'>,
  path = '/',
): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${config.scheme}://${config.host}:${config.port}${normalized}`
}

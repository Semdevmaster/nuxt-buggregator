export interface Origin {
  function_name: string | null
  file: string | null
  line_number: number | null
  hostname: string | null
}

export interface RayPayload {
  type: string
  content: Record<string, unknown>
  origin?: Origin
}

export interface RequestEnvelope {
  uuid: string
  payloads: RayPayload[]
  meta: Record<string, unknown>
}

/** Full Buggregator endpoint — private server config only (proxy). */
export interface BuggregatorEndpointConfig {
  enabled: boolean
  host: string
  port: number
  scheme: string
  project: string
  maxDepth: number
}

/** Public subset — safe for the browser (no host/auth). */
export interface BuggregatorPublicConfig {
  enabled: boolean
  maxDepth: number
}

export interface RaySettings {
  enabled: boolean
  maxDepth: number
  projectName: string
  basePath: string
}

export interface LockStatus {
  active: boolean
  stop_execution?: boolean
}

export interface Transport {
  send: (envelope: RequestEnvelope) => Promise<void>
  lockExists: (name: string) => Promise<LockStatus | false>
}

export interface CreateRayOptions {
  config: RaySettings
  packageVersion?: string
}

export type RayCallback = (ray: import('./ray').Ray) => void

export const BUGGREGATOR_PROXY_BASE = '/api/_buggregator'

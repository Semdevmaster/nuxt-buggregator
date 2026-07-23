import { toRaySettings } from './config'
import { Ray, type RayFn } from './ray'
import { createFetchTransport } from './transport'
import type { BuggregatorPublicConfig, CreateRayOptions, RaySettings, Transport } from './types'
import { BUGGREGATOR_PROXY_BASE } from './types'

const DELEGATE_METHODS = new Set([
  'json',
  'toJson',
  'html',
  'htmlMarkup',
  'text',
  'xml',
  'image',
  'table',
  'date',
  'carbon',
  'error',
  'exception',
  'event',
  'notify',
  'confetti',
  'newScreen',
  'clearScreen',
  'clearAll',
  'separator',
  'showApp',
  'hideApp',
  'enable',
  'disable',
  'count',
  'clearCounters',
  'measure',
  'stopTime',
  'pause',
  'caller',
  'trace',
  'project',
  'projectName',
  'macro',
  'ban',
  'charles',
  'send',
  'log',
  'raw',
  'color',
  'green',
  'red',
  'blue',
  'orange',
  'gray',
  'purple',
  'size',
  'small',
  'large',
  'label',
  'hide',
  'remove',
  'if',
  'once',
  'limit',
  'die',
  'chain',
  'sendCustom',
  'className',
  'pass',
  'screenColor',
  'screenGreen',
  'screenOrange',
  'screenRed',
  'screenPurple',
  'screenBlue',
  'screenGray',
])

function createRayInstance(
  settings: RaySettings,
  transport: Transport,
  packageVersion?: string,
): Ray {
  return new Ray(settings, transport, undefined, packageVersion)
}

/**
 * Creates a Spatie-compatible `ray(...args)` factory.
 * Calling `ray()` returns a new Ray instance (new uuid); chained modifiers reuse it.
 *
 * Uses Proxy so we never assign restricted Function props (`caller`, `arguments`).
 */
export function createRay(options: CreateRayOptions): RayFn {
  const settings: RaySettings = { ...options.config }

  const transport = createFetchTransport({
    basePath: settings.basePath,
  })

  const invoke = (...args: unknown[]) => {
    const instance = createRayInstance(settings, transport, options.packageVersion)
    if (args.length) {
      instance.send(...args)
    }
    return instance
  }

  return new Proxy(invoke, {
    apply(_target, _thisArg, argArray) {
      return invoke(...(argArray as unknown[]))
    },
    get(_target, prop) {
      if (prop === 'Ray') {
        return Ray
      }

      if (prop === 'then') {
        return undefined
      }

      if (typeof prop === 'string' && DELEGATE_METHODS.has(prop)) {
        return (...args: unknown[]) => {
          const instance = createRayInstance(settings, transport, options.packageVersion)
          const method = Reflect.get(instance, prop) as ((...a: unknown[]) => unknown) | undefined
          if (typeof method !== 'function') {
            return undefined
          }
          return method.apply(instance, args)
        }
      }

      return undefined
    },
  }) as RayFn
}

/** Client + server: same factory, isomorphic `$fetch` → local proxy. */
export function createRayForProxy(
  publicConfig: BuggregatorPublicConfig,
  basePath = BUGGREGATOR_PROXY_BASE,
): RayFn {
  return createRay({
    config: toRaySettings(publicConfig, '', basePath),
  })
}

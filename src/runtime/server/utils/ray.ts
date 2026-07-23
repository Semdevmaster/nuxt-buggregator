import { useRuntimeConfig } from 'nitropack/runtime'
import { createRayForProxy } from '../../core/factory'
import { readPublicBuggregatorConfig } from '../../core/config'
import type { RayFn } from '../../core/ray'

let rayFn: RayFn | null = null

function initRay(runtimeConfig = useRuntimeConfig()): RayFn {
  if (!rayFn) {
    rayFn = createRayForProxy(readPublicBuggregatorConfig(runtimeConfig))
  }
  return rayFn
}

/** Ensures the server `ray` singleton is ready (idempotent). */
export async function ensureBuggregatorRay(runtimeConfig = useRuntimeConfig()): Promise<void> {
  initRay(runtimeConfig)
}

export const ray: RayFn = new Proxy(function rayProxy() {} as unknown as RayFn, {
  apply(_target, _thisArg, argArray) {
    return initRay()(...(argArray as unknown[]))
  },
  get(_target, prop) {
    if (prop === 'then') {
      return undefined
    }
    const instance = initRay()
    const value = Reflect.get(instance, prop)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

export { Ray } from '../../core/ray'

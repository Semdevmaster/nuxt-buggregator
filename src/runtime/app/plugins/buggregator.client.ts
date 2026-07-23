import type { Plugin } from '#app'
import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import { createRayForProxy } from '../../core/factory'
import { readPublicBuggregatorConfig } from '../../core/config'
import type { RayFn } from '../../core/ray'

const plugin: Plugin<{ ray: RayFn }> = defineNuxtPlugin(() => {
  const publicConfig = readPublicBuggregatorConfig(useRuntimeConfig())
  const ray = createRayForProxy(publicConfig)

  return {
    provide: {
      ray,
    },
  }
})

export default plugin

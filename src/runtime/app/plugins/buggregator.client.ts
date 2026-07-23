import type { Plugin } from '#app'
import { defineNuxtPlugin, useRuntimeConfig } from '#imports'

import { readPublicBuggregatorConfig } from '../../core/config'
import { createRayForProxy } from '../../core/factory'
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

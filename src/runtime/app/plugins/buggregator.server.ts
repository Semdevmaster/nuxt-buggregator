import type { Plugin } from '#app'
import { defineNuxtPlugin } from '#imports'

import type { RayFn } from '../../core/ray'
import { ensureBuggregatorRay, ray } from '../../server/utils/ray'

const plugin: Plugin<{ ray: RayFn }> = defineNuxtPlugin(async () => {
  await ensureBuggregatorRay()

  return {
    provide: {
      ray,
    },
  }
})

export default plugin

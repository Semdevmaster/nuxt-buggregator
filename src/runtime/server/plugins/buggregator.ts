import { defineNitroPlugin } from '#imports'

import { ensureBuggregatorRay } from '../utils/ray'

export default defineNitroPlugin(async () => {
  await ensureBuggregatorRay()
})

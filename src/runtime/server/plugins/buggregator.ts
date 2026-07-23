import { defineNitroPlugin } from 'nitropack/runtime'
import { ensureBuggregatorRay } from '../utils/ray'

export default defineNitroPlugin(async () => {
  await ensureBuggregatorRay()
})

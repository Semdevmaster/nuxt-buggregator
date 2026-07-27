/**
 * Example: server-side ray() via Nitro auto-import from nuxt-buggregator.
 * GET /api/_buggregator/ping
 */
export default defineEventHandler(async () => {
  await ensureBuggregatorRay()

  ray('buggregator server ping')
  ray({ ok: true, source: 'nitro' })

  return { ok: true }
})

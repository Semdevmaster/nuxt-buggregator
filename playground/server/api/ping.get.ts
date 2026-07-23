export default defineEventHandler(() => {
  ray('server ping').blue().label('nitro')
  return { ok: true }
})

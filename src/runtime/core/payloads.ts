import { dumpToHtml } from './dump/sf-dump'
import { escapeHtml } from './html'
import type { Origin, RayPayload } from './types'

export interface PayloadContext {
  maxDepth: number
  origin: Origin
}

function withOrigin(type: string, content: Record<string, unknown>, origin: Origin): RayPayload {
  return { type, content, origin }
}

export function logPayload(value: unknown, ctx: PayloadContext): RayPayload {
  return withOrigin('log', { values: [dumpToHtml(value, { maxDepth: ctx.maxDepth })] }, ctx.origin)
}

export function customPayload(content: string, label: string, origin: Origin): RayPayload {
  return withOrigin('custom', { content, label }, origin)
}

export function colorPayload(color: string, origin: Origin): RayPayload {
  return withOrigin('color', { color }, origin)
}

export function labelPayload(label: string, origin: Origin): RayPayload {
  return withOrigin('label', { label }, origin)
}

export function sizePayload(size: string, origin: Origin): RayPayload {
  return withOrigin('size', { size }, origin)
}

export function tablePayload(
  values: Record<string | number, unknown> | unknown[],
  label: string,
  ctx: PayloadContext,
): RayPayload {
  let converted: Record<string, string> | string[]

  if (Array.isArray(values)) {
    converted = values.map((item) => dumpToHtml(item, { maxDepth: ctx.maxDepth }))
  } else {
    converted = {}
    for (const prop of Object.keys(values)) {
      converted[prop] = dumpToHtml((values as Record<string, unknown>)[prop], {
        maxDepth: ctx.maxDepth,
      })
    }
  }

  return withOrigin('table', { values: converted, label }, ctx.origin)
}

/**
 * Spatie `toJson()` → encoded JSON text.
 * Buggregator has no renderer for wire type `json_string`, so we send `log`
 * with the JSON string (CodeSnippet) instead of an empty payload card.
 */
export function jsonStringPayload(value: unknown, origin: Origin): RayPayload {
  return withOrigin('log', { values: [JSON.stringify(value, null, 2)] }, origin)
}

export function jsonPayload(json: string, ctx: PayloadContext): RayPayload {
  let decoded: unknown = json
  try {
    decoded = JSON.parse(json)
  } catch {
    // keep raw string
  }

  return customPayload(dumpToHtml(decoded, { maxDepth: ctx.maxDepth }), 'JSON', ctx.origin)
}

export function carbonPayload(date: Date, origin: Origin): RayPayload {
  const pad = (n: number) => String(n).padStart(2, '0')
  const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

  return withOrigin(
    'carbon',
    {
      formatted,
      timestamp: date.getTime() / 1000,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
    origin,
  )
}

export function measurePayload(
  data: {
    name: string
    isNewTimer: boolean
    totalTime: number
    maxMemoryUsageDuringTotalTime: number
    timeSinceLastCall: number
    maxMemoryUsageSinceLastCall: number
  },
  origin: Origin,
): RayPayload {
  return withOrigin(
    'measure',
    {
      name: data.name,
      is_new_timer: data.isNewTimer,
      total_time: data.totalTime,
      max_memory_usage_during_total_time: data.maxMemoryUsageDuringTotalTime,
      time_since_last_call: data.timeSinceLastCall,
      max_memory_usage_since_last_call: data.maxMemoryUsageSinceLastCall,
    },
    origin,
  )
}

export function exceptionPayload(
  err: Error,
  meta: Record<string, unknown>,
  frames: Array<{
    file_name: string
    line_number: number
    class: string
    method: string
    vendor_frame: boolean
  }>,
  origin: Origin,
): RayPayload {
  return withOrigin(
    'exception',
    {
      class: err.name,
      message: err.message,
      frames,
      meta,
    },
    origin,
  )
}

export function errorPayload(err: Error, origin: Origin): RayPayload {
  const content = `<span class="text-red-400 bold">${escapeHtml(err.name)}</span>: <br><span class="pl-5 text-gray-500">${escapeHtml(err.message)}</span>`
  return customPayload(content, 'Error', origin)
}

export function eventPayload(eventName: string, data: unknown[], ctx: PayloadContext): RayPayload {
  return withOrigin(
    'event',
    {
      name: eventName,
      event: data[0],
      payload: dumpToHtml(data, { maxDepth: ctx.maxDepth }),
      class_based_event: true,
    },
    ctx.origin,
  )
}

export function callerPayload(
  frame: {
    file_name: string
    line_number: number
    class: string
    method: string
    vendor_frame: boolean
  },
  origin: Origin,
): RayPayload {
  return withOrigin('caller', { frame }, origin)
}

export function tracePayload(
  frames: Array<{
    file_name: string
    line_number: number
    class: string
    method: string
    vendor_frame: boolean
  }>,
  origin: Origin,
): RayPayload {
  return withOrigin('trace', { frames }, origin)
}

export function notifyPayload(text: string, origin: Origin): RayPayload {
  return withOrigin('notify', { value: text }, origin)
}

export function controlPayload(
  type: string,
  content: Record<string, unknown> = {},
  origin?: Origin,
): RayPayload {
  return {
    type,
    content,
    ...(origin ? { origin } : {}),
  }
}

export function createLockPayload(name: string, origin: Origin): RayPayload {
  return withOrigin('create_lock', { name }, origin)
}

export function htmlPayload(html: string, origin: Origin): RayPayload {
  return customPayload(html, 'HTML', origin)
}

export function htmlMarkupPayload(html: string, origin: Origin): RayPayload {
  return customPayload(escapeHtml(html), 'Markup', origin)
}

export function imagePayload(location: string, origin: Origin): RayPayload {
  return customPayload(`<img src="${escapeHtml(location)}" alt="" />`, 'Image', origin)
}

export function textPayload(text: string, origin: Origin): RayPayload {
  return customPayload(escapeHtml(text).replace(/\n/g, '<br>'), 'Text', origin)
}

export function xmlPayload(xml: string, origin: Origin): RayPayload {
  return customPayload(`<pre>${escapeHtml(xml)}</pre>`, 'XML', origin)
}

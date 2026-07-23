import type { Origin } from './types'

interface ParsedFrame {
  functionName: string | null
  file: string | null
  lineNumber: number | null
}

const MODULE_MARKERS = ['nuxt-buggregator', '/runtime/core/', 'node_modules']

const INTERNAL_FN =
  /^(?:_?Ray\.|Object\.apply|captureOrigin|captureStack|parseStack|dumpToHtml|dumpValue|logPayload|customPayload|createRay|createRayForProxy|createFetch|ensureBuggregator|initRay|getRay|rayProxy)/

let cachedHostname: string | null | undefined

function getHostname(): string | null {
  if (cachedHostname !== undefined) {
    return cachedHostname
  }

  try {
    if (typeof location !== 'undefined' && location.hostname) {
      cachedHostname = location.hostname
      return cachedHostname
    }
  } catch {
    // ignore
  }

  if (typeof process !== 'undefined') {
    cachedHostname = process.env.HOSTNAME || process.env.COMPUTERNAME || null
    return cachedHostname
  }

  cachedHostname = null
  return cachedHostname
}

function parseStackLine(line: string): ParsedFrame | null {
  const trimmed = line.trim()

  // V8: at functionName (file:line:col) OR at file:line:col
  const v8WithFn = /^\s*at\s+(.*?)\s+\((.*):(\d+):(\d+)\)$/.exec(trimmed)
  if (v8WithFn) {
    return {
      functionName: v8WithFn[1] || null,
      file: v8WithFn[2] || null,
      lineNumber: Number(v8WithFn[3]),
    }
  }

  const v8Bare = /^\s*at\s+(.*):(\d+):(\d+)$/.exec(trimmed)
  if (v8Bare) {
    return {
      functionName: null,
      file: v8Bare[1] || null,
      lineNumber: Number(v8Bare[2]),
    }
  }

  // Safari / Firefox: functionName@file:line:col
  const gecko = /^(.*)@(.*):(\d+):(\d+)$/.exec(trimmed)
  if (gecko) {
    return {
      functionName: gecko[1] || null,
      file: gecko[2] || null,
      lineNumber: Number(gecko[3]),
    }
  }

  return null
}

function isInternalFrame(frame: ParsedFrame): boolean {
  const file = frame.file ?? ''
  if (MODULE_MARKERS.some((marker) => file.includes(marker))) {
    return true
  }

  const fn = frame.functionName ?? ''
  return INTERNAL_FN.test(fn)
}

export function parseStackFrames(stack?: string): ParsedFrame[] {
  if (!stack) {
    return []
  }

  return stack
    .split('\n')
    .slice(1)
    .map(parseStackLine)
    .filter((frame): frame is ParsedFrame => frame !== null)
}

export function captureOrigin(extraSkip = 0): Origin {
  const error = new Error()
  const frames = parseStackFrames(error.stack)
  const external = frames.filter((frame) => !isInternalFrame(frame))
  const appFrame = external.find((frame) =>
    /\/(app|server|pages|components|composables)\//.test(frame.file ?? ''),
  )
  const frame = appFrame ?? external[extraSkip] ?? external[0] ?? frames[0] ?? null

  return {
    function_name: frame?.functionName ?? 'unknown',
    file: frame?.file ?? '/unknown-file.js',
    line_number: frame?.lineNumber ?? 1,
    hostname: getHostname(),
  }
}

export function captureStackFrames(limit = 50): Array<{
  file_name: string
  line_number: number
  class: string
  method: string
  vendor_frame: boolean
}> {
  const error = new Error()
  const frames = parseStackFrames(error.stack).filter((frame) => !isInternalFrame(frame))

  return frames.slice(0, limit).map((frame) => {
    const parts = (frame.functionName ?? '')
      .replace(/^Proxy\./, '')
      .split('.')
      .filter(Boolean)
    const className = parts.length > 1 ? (parts.shift() ?? '') : ''
    const method = parts.join('.') || frame.functionName || ''

    return {
      file_name: frame.file ?? '',
      line_number: frame.lineNumber ?? 0,
      class: className,
      method,
      vendor_frame: (frame.file ?? '').includes('node_modules'),
    }
  })
}

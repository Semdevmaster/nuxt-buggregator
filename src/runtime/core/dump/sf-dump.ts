import { escapeHtml } from '../html'
import { nextSfDumpId } from '../ids'

export interface DumpOptions {
  maxDepth?: number
}

function indent(depth: number): string {
  return '  '.repeat(depth)
}

function note(text: string): string {
  return `<span class=sf-dump-note>${escapeHtml(text)}</span>`
}

function num(value: string | number | bigint): string {
  return `<span class=sf-dump-num>${escapeHtml(String(value))}</span>`
}

function constant(value: string): string {
  return `<span class=sf-dump-const>${escapeHtml(value)}</span>`
}

function str(value: string): string {
  return `"<span class=sf-dump-str title="${value.length} characters">${escapeHtml(value)}</span>"`
}

function key(name: string): string {
  return `"<span class=sf-dump-key>${escapeHtml(name)}</span>"`
}

function index(name: string | number): string {
  return `<span class=sf-dump-index>${escapeHtml(String(name))}</span>`
}

function ref(label: string): string {
  return `<span class=sf-dump-ref>${escapeHtml(label)}</span>`
}

function typeName(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (value instanceof Map) return 'Map'
  if (value instanceof Set) return 'Set'
  if (value instanceof Date) return 'Date'
  if (value instanceof RegExp) return 'RegExp'
  if (value instanceof Error) return value.name || 'Error'
  if (typeof value === 'object') {
    const ctor = (value as object).constructor
    if (ctor && ctor !== Object && typeof ctor.name === 'string' && ctor.name) {
      return ctor.name
    }
    return 'Object'
  }
  return typeof value
}

function entriesOf(value: unknown): Array<[string | number, unknown, 'key' | 'index']> {
  if (value instanceof Map) {
    return [...value.entries()].map(([k, v], i) => {
      if (typeof k === 'string') {
        return [k, v, 'key'] as [string | number, unknown, 'key' | 'index']
      }
      if (typeof k === 'number') {
        return [k, v, 'index'] as [string | number, unknown, 'key' | 'index']
      }
      return [i, v, 'index'] as [string | number, unknown, 'key' | 'index']
    })
  }

  if (value instanceof Set) {
    return [...value.values()].map(
      (v, i) => [i, v, 'index'] as [string | number, unknown, 'key' | 'index'],
    )
  }

  if (Array.isArray(value)) {
    return value.map((v, i) => [i, v, 'index'] as [string | number, unknown, 'key' | 'index'])
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as object).map((k) => {
      const numeric = /^\d+$/.test(k)
      return [
        numeric ? Number(k) : k,
        (value as Record<string, unknown>)[k],
        numeric ? 'index' : 'key',
      ] as [string | number, unknown, 'key' | 'index']
    })
  }

  return []
}

function dumpValue(value: unknown, depth: number, maxDepth: number, seen: WeakSet<object>): string {
  if (value === null) {
    return constant('null')
  }

  if (value === undefined) {
    return constant('undefined')
  }

  switch (typeof value) {
    case 'boolean':
      return constant(value ? 'true' : 'false')
    case 'number':
      return num(Object.is(value, -0) ? '-0' : value)
    case 'bigint':
      return num(`${value}n`)
    case 'string':
      return str(value)
    case 'symbol':
      return constant(String(value))
    case 'function': {
      const name = (value as { name?: string }).name || 'anonymous'
      return note(`Function ${name}`)
    }
    case 'object':
      break
    default:
      return constant(typeof value)
  }

  if (value instanceof Date) {
    return `${note('Date')} ${str(value.toISOString())}`
  }

  if (value instanceof RegExp) {
    return `${note('RegExp')} ${str(String(value))}`
  }

  if (value instanceof Error) {
    const message = value.message || ''
    return `${note(value.name || 'Error')} ${str(message)}`
  }

  if (seen.has(value as object)) {
    return ref(`&${typeName(value)}`)
  }

  seen.add(value as object)

  const entries = entriesOf(value)
  const isPlainObject =
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Map) &&
    !(value instanceof Set) &&
    ((value as object).constructor === Object || Object.getPrototypeOf(value) === null)

  const label =
    value instanceof Map
      ? `Map:${entries.length}`
      : value instanceof Set
        ? `Set:${entries.length}`
        : Array.isArray(value) || isPlainObject
          ? `array:${entries.length}`
          : `${typeName(value)}`

  if (entries.length === 0) {
    return `${note(label)} []`
  }

  if (depth >= maxDepth) {
    return `${note(label)} {${ref('…')}}`
  }

  const nextDepth = depth + 1
  // Expand nodes while depth < maxDepth; deeper content is truncated above.
  const sampClass = 'sf-dump-expanded'

  const lines = entries.map(([k, v, kind]) => {
    const left = kind === 'index' ? index(k) : key(String(k))
    return `${indent(nextDepth)}${left} => ${dumpValue(v, nextDepth, maxDepth, seen)}`
  })

  return `${note(label)} [<samp data-depth=${nextDepth} class=${sampClass}>\n${lines.join('\n')}\n${indent(depth)}</samp>]`
}

/**
 * Serialize a JS value to Symfony VarDumper `sf-dump` HTML.
 * Nesting is dumped and auto-expanded up to `maxDepth`; deeper nodes become `{…}`.
 * Buggregator mounts interactivity via `callSfDump(sf-dump-<id>)`.
 */
export function dumpToHtml(value: unknown, options: DumpOptions = {}): string {
  const maxDepth = options.maxDepth ?? 3
  const id = nextSfDumpId()
  const body = dumpValue(value, 0, maxDepth, new WeakSet())

  return `<pre class=sf-dump id=sf-dump-${id} data-indent-pad="  ">${body}\n</pre>`
}

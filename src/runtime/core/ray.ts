import { newUuid } from './ids'
import { captureOrigin, captureStackFrames } from './origin'
import * as P from './payloads'
import type {
  Origin,
  RayCallback,
  RayPayload,
  RaySettings,
  RequestEnvelope,
  Transport,
} from './types'

interface LimiterState {
  counter: number
  limit: number
}

interface StopwatchState {
  startedAt: number
  lastAt: number
  laps: number[]
}

const PACKAGE_VERSION = '1.0.0'

export class Ray {
  static counters = new Map<string, number>()
  static stopWatches = new Map<string, StopwatchState>()
  static limiters = new Map<string, LimiterState>()
  static lockCounter = 0
  static macros: Record<string, (...args: unknown[]) => unknown> = {}
  static projectName = ''
  static enabledOverride: boolean | null = null
  static onceKeys = new Set<string>()

  uuid: string
  protected settings: RaySettings
  protected transport: Transport
  protected packageVersion: string
  protected canSendPayload = true
  protected limitKey: string | null = null
  protected sendQueue: Promise<void> = Promise.resolve()
  protected cachedOrigin: Origin | null = null

  constructor(
    settings: RaySettings,
    transport: Transport,
    uuid?: string,
    packageVersion = PACKAGE_VERSION,
  ) {
    this.settings = settings
    this.transport = transport
    this.uuid = uuid ?? newUuid()
    this.packageVersion = packageVersion
    Ray.projectName = settings.projectName || Ray.projectName
  }

  protected origin(): Origin {
    // Reuse origin across chain modifiers on the same instance
    if (!this.cachedOrigin) {
      this.cachedOrigin = captureOrigin(1)
    }
    return this.cachedOrigin
  }

  protected ctx() {
    return { maxDepth: this.settings.maxDepth, origin: this.origin() }
  }

  protected envelope(payloads: RayPayload[]): RequestEnvelope {
    return {
      uuid: this.uuid,
      payloads,
      meta: {
        node_ray_package_version: this.packageVersion,
        ray_package_version: this.packageVersion,
        project_name: Ray.projectName || this.settings.projectName || '',
      },
    }
  }

  /** Skip expensive dump/stack work when Ray is disabled. */
  protected guard(): boolean {
    return this.enabled() && this.canSendPayload
  }

  sendRequest(payloads: RayPayload | RayPayload[]): this {
    if (!this.guard()) {
      return this
    }

    if (this.limitKey) {
      const state = Ray.limiters.get(this.limitKey)
      if (state && state.counter >= state.limit) {
        return this
      }
      if (state) {
        state.counter += 1
      }
    }

    const list = Array.isArray(payloads) ? payloads : [payloads]
    // Serialize sends on this instance so chain modifiers (same uuid) arrive in order
    this.sendQueue = this.sendQueue
      .then(() => this.transport.send(this.envelope(list)))
      .catch(() => {
        // Keep the queue alive if a send fails unexpectedly
      })
    return this
  }

  send(...args: unknown[]): this {
    if (!args.length || !this.guard()) {
      return this
    }

    const ctx = this.ctx()
    return this.sendRequest(args.map((arg) => P.logPayload(arg, ctx)))
  }

  log(...args: unknown[]): this {
    return this.send(...args)
  }

  raw(...args: unknown[]): this {
    return this.send(...args)
  }

  pass<T>(argument: T): T {
    this.send(argument)
    return argument
  }

  className(object: unknown): this {
    const name =
      object && typeof object === 'object'
        ? (object as { constructor?: { name?: string } }).constructor?.name || 'Object'
        : typeof object
    return this.send(name)
  }

  json(...jsons: string[]): this {
    if (!jsons.length || !this.guard()) {
      return this
    }
    const ctx = this.ctx()
    return this.sendRequest(jsons.map((json) => P.jsonPayload(json, ctx)))
  }

  toJson(...values: unknown[]): this {
    if (!values.length || !this.guard()) {
      return this
    }
    const origin = this.origin()
    return this.sendRequest(values.map((value) => P.jsonStringPayload(value, origin)))
  }

  html(html = ''): this {
    return this.sendRequest(P.htmlPayload(html, this.origin()))
  }

  htmlMarkup(html: string): this {
    return this.sendRequest(P.htmlMarkupPayload(html, this.origin()))
  }

  text(text = ''): this {
    return this.sendRequest(P.textPayload(text, this.origin()))
  }

  xml(xml: string): this {
    return this.sendRequest(P.xmlPayload(xml, this.origin()))
  }

  image(location: string): this {
    return this.sendRequest(P.imagePayload(location, this.origin()))
  }

  table(values: Record<string | number, unknown> | unknown[], label = 'Table'): this {
    if (!this.guard()) {
      return this
    }
    return this.sendRequest(P.tablePayload(values, label, this.ctx()))
  }

  date(date: Date): this {
    return this.sendRequest(P.carbonPayload(date, this.origin()))
  }

  carbon(date: Date): this {
    return this.date(date)
  }

  error(err: Error): this {
    return this.sendRequest(P.errorPayload(err, this.origin())).red()
  }

  exception(err: Error, meta: Record<string, unknown> = {}): this {
    if (!this.guard()) {
      return this
    }
    const frames = captureStackFrames()
    return this.sendRequest(P.exceptionPayload(err, meta, frames, this.origin())).red()
  }

  event(eventName: string, data: unknown[] = []): this {
    return this.sendRequest(P.eventPayload(eventName, data, this.ctx()))
  }

  color(name: string): this {
    return this.sendRequest(P.colorPayload(name, this.origin()))
  }

  green(): this {
    return this.color('green')
  }

  orange(): this {
    return this.color('orange')
  }

  red(): this {
    return this.color('red')
  }

  purple(): this {
    return this.color('purple')
  }

  blue(): this {
    return this.color('blue')
  }

  gray(): this {
    return this.color('gray')
  }

  size(size: string): this {
    return this.sendRequest(P.sizePayload(size, this.origin()))
  }

  small(): this {
    return this.size('sm')
  }

  large(): this {
    return this.size('lg')
  }

  label(label: string): this {
    return this.sendRequest(P.labelPayload(label, this.origin()))
  }

  separator(): this {
    return this.sendRequest(P.controlPayload('separator', {}, this.origin()))
  }

  newScreen(name = ''): this {
    return this.sendRequest(P.controlPayload('new_screen', { name }, this.origin()))
  }

  clearScreen(): this {
    return this.newScreen()
  }

  clearAll(): this {
    return this.sendRequest(P.controlPayload('clear_all', {}, this.origin()))
  }

  screenColor(color: string): this {
    return this.sendRequest(P.controlPayload('screen_color', { color }, this.origin()))
  }

  screenGreen(): this {
    return this.screenColor('green')
  }

  screenOrange(): this {
    return this.screenColor('orange')
  }

  screenRed(): this {
    return this.screenColor('red')
  }

  screenPurple(): this {
    return this.screenColor('purple')
  }

  screenBlue(): this {
    return this.screenColor('blue')
  }

  screenGray(): this {
    return this.screenColor('gray')
  }

  hide(): this {
    return this.sendRequest(P.controlPayload('hide', {}, this.origin()))
  }

  remove(): this {
    return this.sendRequest(P.controlPayload('remove', {}, this.origin()))
  }

  showApp(): this {
    return this.sendRequest(P.controlPayload('show_app', {}, this.origin()))
  }

  hideApp(): this {
    return this.sendRequest(P.controlPayload('hide_app', {}, this.origin()))
  }

  notify(text: string): this {
    return this.sendRequest(P.notifyPayload(text, this.origin()))
  }

  confetti(): this {
    return this.sendRequest(P.controlPayload('confetti', {}, this.origin()))
  }

  enable(): this {
    Ray.enabledOverride = true
    this.settings.enabled = true
    return this
  }

  disable(): this {
    Ray.enabledOverride = false
    this.settings.enabled = false
    return this
  }

  enabled(): boolean {
    if (Ray.enabledOverride !== null) {
      return Ray.enabledOverride
    }
    return this.settings.enabled
  }

  disabled(): boolean {
    return !this.enabled()
  }

  if(boolOrCallable: boolean | (() => boolean), callback?: RayCallback | null): this {
    const result = typeof boolOrCallable === 'function' ? boolOrCallable() : boolOrCallable
    if (!result) {
      return this
    }
    if (callback) {
      callback(this)
    }
    return this
  }

  once(...args: unknown[]): this {
    const origin = this.origin()
    const key = `${origin.file}:${origin.line_number}`
    if (Ray.onceKeys.has(key)) {
      return this
    }
    Ray.onceKeys.add(key)
    if (args.length) {
      return this.send(...args)
    }
    return this
  }

  limit(count: number): this {
    const origin = this.origin()
    const key = `${origin.file}:${origin.line_number}`
    this.limitKey = key
    if (!Ray.limiters.has(key)) {
      Ray.limiters.set(key, { counter: 0, limit: count })
    }
    return this
  }

  count(name?: string | null): this {
    const origin = this.origin()
    const key = name ?? `${origin.file}:${origin.line_number}`
    const times = (Ray.counters.get(key) ?? 0) + 1
    Ray.counters.set(key, times)
    const message = name
      ? `Called '${name}' ${times} ${times === 1 ? 'time' : 'times'}.`
      : `Called ${times} ${times === 1 ? 'time' : 'times'}.`
    return this.sendCustom(message, 'Count')
  }

  clearCounters(): this {
    Ray.counters.clear()
    return this
  }

  measure(stopwatchName: string | (() => void) = 'default'): this {
    if (!this.guard()) {
      return this
    }

    if (typeof stopwatchName === 'function') {
      const startedAt = performance.now()
      stopwatchName()
      const totalTime = performance.now() - startedAt
      return this.sendRequest(
        P.measurePayload(
          {
            name: 'closure',
            isNewTimer: false,
            totalTime,
            maxMemoryUsageDuringTotalTime: 0,
            timeSinceLastCall: totalTime,
            maxMemoryUsageSinceLastCall: 0,
          },
          this.origin(),
        ),
      )
    }

    const existing = Ray.stopWatches.get(stopwatchName)
    if (!existing) {
      const now = performance.now()
      Ray.stopWatches.set(stopwatchName, { startedAt: now, lastAt: now, laps: [] })
      return this.sendRequest(
        P.measurePayload(
          {
            name: stopwatchName,
            isNewTimer: true,
            totalTime: 0,
            maxMemoryUsageDuringTotalTime: 0,
            timeSinceLastCall: 0,
            maxMemoryUsageSinceLastCall: 0,
          },
          this.origin(),
        ),
      )
    }

    const now = performance.now()
    const lap = now - existing.lastAt
    existing.laps.push(lap)
    existing.lastAt = now
    const totalTime = now - existing.startedAt

    return this.sendRequest(
      P.measurePayload(
        {
          name: stopwatchName,
          isNewTimer: false,
          totalTime,
          maxMemoryUsageDuringTotalTime: 0,
          timeSinceLastCall: lap,
          maxMemoryUsageSinceLastCall: 0,
        },
        this.origin(),
      ),
    )
  }

  stopTime(stopwatchName = ''): this {
    if (!stopwatchName) {
      Ray.stopWatches.clear()
      return this
    }
    Ray.stopWatches.delete(stopwatchName)
    return this
  }

  async pause(): Promise<this> {
    Ray.lockCounter += 1
    const name = `${Date.now()}-${Ray.lockCounter}`
    this.sendRequest(P.createLockPayload(name, this.origin()))

    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const exists = await this.transport.lockExists(name)
      if (!exists || !exists.active) {
        break
      }
    }

    return this
  }

  die(status = ''): never {
    throw new Error(status || 'Ray die()')
  }

  caller(): this {
    if (!this.guard()) {
      return this
    }
    const frames = captureStackFrames()
    const frame = frames[0] ?? {
      file_name: '',
      line_number: 0,
      class: '',
      method: '',
      vendor_frame: false,
    }
    return this.sendRequest(P.callerPayload(frame, this.origin()))
  }

  trace(): this {
    if (!this.guard()) {
      return this
    }
    return this.sendRequest(P.tracePayload(captureStackFrames(), this.origin()))
  }

  project(projectName: string): this {
    Ray.projectName = projectName
    this.settings.projectName = projectName
    return this
  }

  projectName(projectName: string): this {
    return this.project(projectName)
  }

  macro(name: string, handler: (...args: unknown[]) => unknown): this {
    Ray.macros[name] = handler
    ;(this as unknown as Record<string, unknown>)[name] = (...args: unknown[]) =>
      handler.apply(this, args)
    return this
  }

  chain(callback: RayCallback): this {
    callback(this)
    return this
  }

  sendCustom(content: string, label = ''): this {
    return this.sendRequest(P.customPayload(content, label, this.origin()))
  }

  ban(): this {
    return this.send('🕶')
  }

  charles(): this {
    return this.send('🎶 🎹 🎷 🕺')
  }
}

export type RayFn = ((...args: unknown[]) => Ray) & {
  [K in keyof Ray as Ray[K] extends (...args: never[]) => unknown ? K : never]?: Ray[K]
} & {
  Ray: typeof Ray
}

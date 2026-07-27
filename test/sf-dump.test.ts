import { describe, expect, it } from 'vitest'

import { dumpToHtml } from '../src/runtime/core/dump/sf-dump'

describe('dumpToHtml maxDepth', () => {
  const nested = {
    user: 'semnix',
    nested: { ok: true, items: [1, 2] },
  }

  it('auto-expands all serialized levels up to maxDepth', () => {
    const html = dumpToHtml(nested, { maxDepth: 5 })

    expect(html).toContain('class=sf-dump-expanded')
    expect(html).not.toContain('class=sf-dump-compact')
    expect(html).toContain('<span class=sf-dump-key>ok</span>')
    expect(html).toContain('<span class=sf-dump-index>0</span>')
    expect(html).not.toContain('{…}')
  })

  it('truncates nodes beyond maxDepth', () => {
    const html = dumpToHtml(nested, { maxDepth: 1 })

    expect(html).toContain('class=sf-dump-expanded')
    expect(html).toContain('{<span class=sf-dump-ref>…</span>}')
    expect(html).not.toContain('sf-dump-key">ok')
  })
})

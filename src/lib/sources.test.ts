import { describe, expect, it } from 'vitest'
import { isDiscussion, searchExa } from './sources'

describe('isDiscussion', () => {
  it('keeps GitHub issues, discussions and pull requests, and drops READMEs', () => {
    expect(isDiscussion('https://github.com/acme/tool/issues/12')).toBe(true)
    expect(isDiscussion('https://github.com/acme/tool/discussions/7')).toBe(true)
    expect(isDiscussion('https://github.com/acme/tool/pull/99')).toBe(true)
    expect(isDiscussion('https://github.com/acme/tool')).toBe(false)
    expect(isDiscussion('https://github.com/acme/tool/blob/main/README.md')).toBe(false)
  })

  it('lets other venues through', () => {
    expect(isDiscussion('https://dev.to/someone/my-post-1abc')).toBe(true)
  })
})

describe('searchExa', () => {
  it('returns only http(s) discussion pages that carry text', async () => {
    const call = async () => ({
      results: [
        { url: 'https://github.com/acme/tool', text: 'A README' },
        { url: 'https://github.com/acme/tool/issues/3', text: 'An issue', publishedDate: '2026-09-01' },
        { url: 'javascript:alert(1)', text: 'nope' },
        { url: 'https://dev.to/a/post', text: '' },
      ],
    })
    const pages = await searchExa('q', call)
    expect(pages.map((p) => p.url)).toEqual(['https://github.com/acme/tool/issues/3'])
    expect(pages[0].site).toBe('GitHub')
  })

  it('returns nothing, without throwing, when the response shape is unexpected', async () => {
    expect(await searchExa('q', async () => ({ items: [] }))).toEqual([])
  })
})

/**
 * The run-trial pipeline with its paid boundaries faked: no network, no AI.
 * The records store, search and extractor are stubs; the verifier is real.
 * Proves an invented quote is stored as removed, never as evidence.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Job, JobContext } from 'deepspace/worker'

type Row = { recordId: string; data: Record<string, unknown> }
const store: Record<string, Row[]> = {}
let nextId = 0

// A tiny in-memory stand-in for the RecordRoom tools API.
const fakeDb = {
  records: {
    async query(collection: string, opts?: { where?: Record<string, unknown> }) {
      return (store[collection] ?? []).filter((r) =>
        Object.entries(opts?.where ?? {}).every(([k, v]) => (k === 'recordId' ? r.recordId === v : r.data[k] === v)),
      )
    },
    async create(collection: string, data: Record<string, unknown>) {
      const row = { recordId: `r${++nextId}`, data }
      ;(store[collection] ??= []).push(row)
      return { recordId: row.recordId }
    },
    async update(collection: string, recordId: string, data: Record<string, unknown>) {
      const row = store[collection].find((r) => r.recordId === recordId)!
      row.data = { ...row.data, ...data }
    },
    async delete(collection: string, recordId: string) {
      store[collection] = store[collection].filter((r) => r.recordId !== recordId)
    },
  },
  integrations: { call: vi.fn(async () => ({ results: [] })) },
  ownerUserId: 'owner',
}

vi.mock('deepspace/worker', () => ({ buildCronContext: () => fakeDb }))

const page = 'I tried it for a month. The agent gets me to a demo in an afternoon, but auth took two more weeks.'
const hn = vi.fn(async () => [{ url: 'https://news.ycombinator.com/item?id=1', site: 'Hacker News', postedAt: '2026-09-01T00:00:00Z', text: page }])
vi.mock('./lib/sources', () => ({ searchHackerNews: () => hn(), searchExa: async () => [] }))

const extract = vi.fn(async () => ({
  quotes: [
    { text: 'The agent gets me to a demo in an afternoon, but auth took two more weeks.', stance: 'push' },
    { text: 'Coding agents cannot handle authentication at all.', stance: 'push' },
  ],
}))
vi.mock('./lib/ai', () => ({ extractQuotes: () => extract() }))

const { runJob } = await import('./jobs')

const ctx: JobContext = { progress: vi.fn(), continue: vi.fn(), signal: new AbortController().signal }
const job = (versionId: string) => ({ id: 'j1', type: 'run-trial', payload: { versionId } }) as unknown as Job

function seed(claimKey = 'coding agents ship production apps') {
  store.cases = [{ recordId: 'c1', data: { title: 'Hero', audience: 'solo developers' } }]
  store.versions = [
    { recordId: 'v1', data: { caseId: 'c1', number: 1, message: 'm', status: 'running' } },
    { recordId: 'v2', data: { caseId: 'c1', number: 2, message: 'm2', status: 'running' } },
  ]
  store.claims = [
    { recordId: 'k1', data: { caseId: 'c1', versionId: 'v1', index: 1, text: 'Coding agents ship production apps', searchQuery: 'agents production', claimKey, status: 'approved' } },
    { recordId: 'k2', data: { caseId: 'c1', versionId: 'v2', index: 1, text: 'Coding agents ship production apps', searchQuery: 'agents production', claimKey, status: 'approved' } },
  ]
  store.quotes = []
}

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k]
  vi.clearAllMocks()
  seed()
})

describe('run-trial', () => {
  it('keeps the verbatim quote, stores the invented one as removed, and finishes the version', async () => {
    const result = await runJob(job('v1'), ctx, {} as never)

    expect(result).toEqual({ kept: 1, removed: 1, pagesRead: 1 })
    const quotes = store.quotes.map((q) => q.data)
    expect(quotes).toContainEqual(expect.objectContaining({ status: 'kept', claimId: 'k1', sourceUrl: 'https://news.ycombinator.com/item?id=1' }))
    expect(quotes).toContainEqual(
      expect.objectContaining({ status: 'removed', removeReason: 'Not on the source page', text: 'Coding agents cannot handle authentication at all.' }),
    )
    expect(store.versions[0].data).toMatchObject({ status: 'done', pagesRead: 1 })
  })

  it('reuses fresh verified quotes for the same claim instead of searching again', async () => {
    await runJob(job('v1'), ctx, {} as never)
    hn.mockClear()
    extract.mockClear()

    const result = await runJob(job('v2'), ctx, {} as never)

    expect(hn).not.toHaveBeenCalled()
    expect(extract).not.toHaveBeenCalled()
    expect(result).toMatchObject({ kept: 1, pagesRead: 0 })
    const reused = store.quotes.find((q) => q.data.versionId === 'v2')!
    expect(reused.data).toMatchObject({ claimId: 'k2', status: 'kept', reusedFrom: expect.any(String) })
  })

  it('marks the version failed when the trial breaks', async () => {
    hn.mockRejectedValueOnce(Object.assign(new Error('boom'), { name: 'AbortError' }))
    await expect(runJob(job('v1'), ctx, {} as never)).rejects.toThrow('boom')
    expect(store.versions[0].data.status).toBe('failed')
  })
})

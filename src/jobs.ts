/**
 * Background jobs. One type: 'run-trial', enqueued only by the startTrial
 * server action.
 *
 * For each approved claim:
 *   1. Memory: reuse the team's fresh verified quotes for the same claim.
 *   2. Scout: search Hacker News and Exa (plain code), get page text.
 *   3. Extract: the AI picks sentences with a stance.
 *   4. Verify: code keeps a quote only if it is on the page word for word.
 * Results are written as records as they are found, so the board fills live.
 *
 * The handler runs as the app owner and writes quotes with RBAC bypassed.
 * That is the only path that can create a quote.
 */

import { buildCronContext } from 'deepspace/worker'
import type { CronContext, Job, JobContext } from 'deepspace/worker'
import type { Env } from '../worker'
import { config } from './config'
import { extractQuotes } from './lib/ai'
import { searchExa, searchHackerNews, type SourcePage } from './lib/sources'
import { rejectionReason } from './lib/verifyQuote'
import type { CaseData, ClaimData, QuoteData, VersionData } from './types'

interface Row<T> {
  recordId: string
  data: T
}

export async function runJob(job: Job, ctx: JobContext, env: Env): Promise<unknown> {
  if (job.type === 'run-trial') {
    const { versionId } = job.payload as { versionId: string }
    const db = buildCronContext(env, env.OWNER_USER_ID, `app:${env.DEEPSPACE_APP_ID}`)
    // Stop on user cancel or on the deadline, whichever comes first.
    const signal = AbortSignal.any([ctx.signal, AbortSignal.timeout(config.limits.trialDeadlineMs)])
    try {
      return await runTrial(versionId, db, env, ctx, signal)
    } catch (err) {
      const message = signal.aborted ? 'The trial was canceled or ran out of time.' : 'The trial stopped because of an error. Run it again.'
      console.error('[run-trial] failed', err)
      await db.records.update('versions', versionId, { status: 'failed', error: message })
      throw err
    }
  }
  throw new Error(`Unknown job type: ${job.type}`)
}

async function one<T>(db: CronContext, collection: string, recordId: string): Promise<Row<T>> {
  const rows = (await db.records.query(collection, { where: { recordId }, limit: 1 })) as Row<T>[]
  if (!rows[0]) throw new Error(`${collection} ${recordId} not found`)
  return rows[0]
}

async function runTrial(versionId: string, db: CronContext, env: Env, ctx: JobContext, signal: AbortSignal) {
  const version = await one<VersionData>(db, 'versions', versionId)
  const caseRow = await one<CaseData>(db, 'cases', version.data.caseId)
  const claims = ((await db.records.query('claims', { where: { versionId, status: 'approved' }, limit: 50 })) as Row<ClaimData>[])
    .sort((a, b) => a.data.index - b.data.index)

  // A re-run after a failure starts clean, so evidence is never counted twice.
  const old = (await db.records.query('quotes', { where: { versionId }, limit: 500 })) as Row<QuoteData>[]
  for (const q of old) await db.records.delete('quotes', q.recordId)

  let pagesRead = 0
  let kept = 0
  let removed = 0

  for (const [i, claim] of claims.entries()) {
    const n = claim.data.index
    const step = (part: number, message: string) => ctx.progress((i + part) / claims.length, message)
    signal.throwIfAborted()

    // 1. Memory
    step(0, `Checking earlier trials for claim ${n}`)
    const reused = await reuseFreshQuotes(db, claim, versionId)
    if (reused > 0) {
      kept += reused
      continue
    }

    // 2. Scout
    step(0.1, `Searching Hacker News for claim ${n}`)
    const query = claim.data.searchQuery || claim.data.text
    const hnPages = await searchHackerNews(query, signal).catch(logSourceError('hn'))
    step(0.25, `Searching dev.to and GitHub for claim ${n}`)
    const exaPages = await searchExa(query, (endpoint, params) => db.integrations.call(endpoint, params)).catch(logSourceError('exa'))
    const pages: SourcePage[] = [...hnPages, ...exaPages]
    pagesRead += pages.length
    const before = { kept, removed }

    // 3 + 4. Extract, then verify every quote against the page it came from.
    let keptForClaim = 0
    for (const [p, page] of pages.entries()) {
      if (keptForClaim >= config.quotes.maxPerClaim) break
      step(0.4 + (0.6 * p) / Math.max(pages.length, 1), `Reading page ${p + 1} of ${pages.length} for claim ${n}, checking quotes`)
      const extracted = await extractQuotes(env, claim.data.text, caseRow.data.audience, page.text, signal).catch((err) => {
        if (signal.aborted) throw err
        console.warn('[run-trial] extract failed for', page.url, err)
        return { quotes: [] }
      })
      // Only sentences about the claim itself; near-misses are dropped before verification.
      for (const q of extracted.quotes.filter((x) => x.direct !== false)) {
        if (keptForClaim >= config.quotes.maxPerClaim) break
        const reason = rejectionReason(q.text, page.text)
        const quote: QuoteData = {
          caseId: claim.data.caseId,
          versionId,
          claimId: claim.recordId,
          claimKey: claim.data.claimKey,
          text: q.text,
          stance: q.stance,
          status: reason ? 'removed' : 'kept',
          removeReason: reason ?? '',
          sourceUrl: page.url,
          site: page.site,
          postedAt: page.postedAt ?? '',
          fetchedAt: new Date().toISOString(),
          why: q.why?.slice(0, 200) ?? '',
        }
        await db.records.create('quotes', { ...quote })
        if (reason) removed++
        else {
          kept++
          keptForClaim++
        }
      }
    }
    // One line per claim, so the logs show which source found what.
    console.info(
      `[run-trial] claim ${n} query=${JSON.stringify(query)} hn=${hnPages.length} exa=${exaPages.length} kept=${kept - before.kept} removed=${removed - before.removed}`,
    )
  }

  await db.records.update('versions', versionId, {
    status: 'done',
    pagesRead,
    finishedAt: new Date().toISOString(),
    error: '',
  })
  ctx.progress(1, `Trial finished. ${kept} quotes kept, ${removed} removed.`)
  return { kept, removed, pagesRead }
}

/**
 * Evidence memory: if the team tested the same claim recently, copy its kept
 * quotes into this version instead of searching again. Votes stay on the
 * original quote; the copy points to it with `reusedFrom`.
 */
async function reuseFreshQuotes(db: CronContext, claim: Row<ClaimData>, versionId: string): Promise<number> {
  const cutoff = Date.now() - config.memory.freshDays * 24 * 60 * 60 * 1000
  const prior = ((await db.records.query('quotes', { where: { claimKey: claim.data.claimKey, status: 'kept' }, limit: 200 })) as Row<QuoteData>[])
    .filter((q) => q.data.versionId !== versionId && !q.data.reusedFrom && Date.parse(q.data.fetchedAt) >= cutoff)
    .slice(0, config.quotes.maxPerClaim)

  for (const q of prior) {
    await db.records.create('quotes', { ...q.data, versionId, caseId: claim.data.caseId, claimId: claim.recordId, reusedFrom: q.recordId })
  }
  return prior.length
}

// One source failing should not sink the trial; the other may still find evidence.
function logSourceError(source: string) {
  return (err: unknown): SourcePage[] => {
    if (err instanceof Error && err.name === 'AbortError') throw err
    console.warn(`[run-trial] ${source} search failed`, err)
    return []
  }
}

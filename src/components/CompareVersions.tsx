/**
 * Side-by-side versions of one case: each version's message, then each claim
 * with its counts. The point is to see whether version 2 draws less pushback.
 */

import type { RecordData } from 'deepspace'
import { tally, tallyLine, verdictOf } from '../lib/evidence'
import { cn } from '../lib/utils'
import type { ClaimData, QuoteData, VersionData } from '../types'
import { toneOf } from './tone'

export function CompareVersions({
  versions,
  claims,
  quotes,
}: {
  versions: RecordData<VersionData>[]
  claims: RecordData<ClaimData>[]
  quotes: RecordData<QuoteData>[]
}) {
  return (
    <section aria-label="Compare versions" className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
      {versions.map((v) => {
        const vClaims = claims.filter((c) => c.data.versionId === v.recordId && c.data.status === 'approved').sort((a, b) => a.data.index - b.data.index)
        const vQuotes = quotes.filter((q) => q.data.versionId === v.recordId)
        const total = tally(vQuotes.map((q) => q.data))
        return (
          <article key={v.recordId} className="overflow-hidden panel">
            <div className="panel-header px-[22px] py-5">
              <p className="m-0 mb-2 text-sm font-semibold text-muted-foreground">Version {v.data.number}</p>
              <p className="m-0 text-xl font-semibold leading-snug tracking-[-0.02em]">{v.data.message}</p>
              <p className="m-0 mt-3 text-sm text-muted-foreground">
                {v.data.status === 'done' ? `In total: ${tallyLine(total)}` : 'Not tried yet'}
              </p>
            </div>
            <ol className="m-0 list-none p-0">
              {vClaims.map((c) => {
                const t = tally(vQuotes.filter((q) => q.data.claimId === c.recordId).map((q) => q.data))
                const tone = toneOf(verdictOf(t))
                return (
                  <li key={c.recordId} className="flex items-start gap-3 border-t border-rule px-[22px] py-3.5">
                    <span className={cn('flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg text-[13px] font-bold', tone.badge)}>
                      {c.data.index}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{c.data.text}</span>
                      <span className="block text-sm text-muted-foreground">{tallyLine(t)}</span>
                    </span>
                  </li>
                )
              })}
            </ol>
          </article>
        )
      })}
    </section>
  )
}

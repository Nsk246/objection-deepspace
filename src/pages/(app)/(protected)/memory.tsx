/**
 * /memory — Evidence memory: every verified quote the team has kept, across
 * cases, grouped by claim, with the team's votes. This is the team's past
 * judgment, not model memory; trials reuse it for repeated claims.
 */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'deepspace'
import { SearchInput } from '@/components/ui'
import { STANCE_LABEL } from '../../../lib/evidence'
import { cn } from '../../../lib/utils'
import type { CaseData, ClaimData, QuoteData, VoteData } from '../../../types'

export default function MemoryPage() {
  const { records: quotes, status } = useQuery<QuoteData>('quotes', { where: { status: 'kept' } })
  const { records: claims } = useQuery<ClaimData>('claims')
  const { records: cases } = useQuery<CaseData>('cases')
  const { records: votes } = useQuery<VoteData>('votes')
  const [search, setSearch] = useState('')

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase()
    // Copies made by evidence memory point at an original; show each quote once.
    const originals = quotes.filter((q) => !q.data.reusedFrom)
    const byKey = new Map<string, typeof originals>()
    for (const q of originals) {
      const list = byKey.get(q.data.claimKey) ?? []
      list.push(q)
      byKey.set(q.data.claimKey, list)
    }
    return [...byKey.entries()]
      .map(([key, list]) => {
        const claim = claims.find((c) => c.recordId === list[0].data.claimId)
        const caseRow = cases.find((c) => c.recordId === list[0].data.caseId)
        return { key, claimText: claim?.data.text ?? key, caseRow, list }
      })
      .filter((g) => !term || g.claimText.toLowerCase().includes(term) || g.list.some((q) => q.data.text.toLowerCase().includes(term)))
  }, [quotes, claims, cases, search])

  const voteCount = (quoteId: string, value: VoteData['value']) => votes.filter((v) => v.data.quoteId === quoteId && v.data.value === value).length

  return (
    <div className="mx-auto max-w-4xl px-4 py-7 md:px-8">
      <h1 className="m-0 mb-1 text-[22px] font-bold tracking-[-0.02em]">Evidence memory</h1>
      <p className="m-0 mb-5 text-muted-foreground">
        Every verified quote your team kept, grouped by claim. When a claim is tried again within a week, the trial reuses these quotes and their votes instead of searching again.
      </p>
      <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search claims and quotes" aria-label="Search claims and quotes" />

      <div className="mt-6 flex flex-col gap-6">
        {status === 'loading' && [0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}
        {status === 'ready' && groups.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-muted-foreground">
            {search ? 'Nothing matches that search.' : 'No verified quotes yet. Run a trial on a case and the kept quotes collect here.'}
          </p>
        )}
        {groups.map((g) => (
          <section key={g.key} className="overflow-hidden panel">
            <div className="panel-header px-[22px] py-4">
              <h2 className="m-0 text-[17px] font-semibold">{g.claimText}</h2>
              {g.caseRow && (
                <p className="m-0 text-[15px] text-muted-foreground">
                  First tested in <Link to={`/cases/${g.caseRow.recordId}`}>{g.caseRow.data.title}</Link>
                </p>
              )}
            </div>
            <ol className="m-0 list-none p-0">
              {g.list.map((q) => (
                <li key={q.recordId} className="border-t border-rule px-[22px] py-4">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[15px] text-muted-foreground">
                    <span className={cn('rounded-md px-2 py-0.5 font-semibold', q.data.stance === 'push' ? 'bg-push-tint text-push-badge' : 'bg-support-tint text-support-badge')}>
                      {STANCE_LABEL[q.data.stance]}
                    </span>
                    {q.data.site}
                    <span>
                      Relevant {voteCount(q.recordId, 'relevant')}, off-topic {voteCount(q.recordId, 'off_topic')}
                    </span>
                  </div>
                  <blockquote className="m-0 leading-relaxed">{q.data.text}</blockquote>
                  <a href={q.data.sourceUrl} target="_blank" rel="noreferrer noopener" className="mt-1.5 inline-block text-[15px] font-medium text-support hover:text-foreground">
                    Open thread
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}

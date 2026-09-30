/**
 * Evidence for the selected claim: filter pills, then verified quotes with
 * team votes. Removed quotes stay visible at the end, struck through, with
 * the reason, so nobody has to take the filter on trust.
 */

import { useMemo, useState } from 'react'
import { useAuth, useMutations, type RecordData } from 'deepspace'
import { Check } from 'lucide-react'
import { STANCE_LABEL, tally, VERDICT_LABEL, verdictOf } from '../lib/evidence'
import { cn } from '../lib/utils'
import type { QuoteData, VoteData } from '../types'
import { toneOf } from './tone'

type Filter = 'all' | 'push' | 'support' | 'removed'

/** Votes attach to the original quote, so a reused quote carries the team's earlier judgment. */
export const voteKey = (q: RecordData<QuoteData>) => q.data.reusedFrom || q.recordId

export function EvidenceList({
  claim,
  quotes,
  votes,
}: {
  claim: { index: number; text: string }
  quotes: RecordData<QuoteData>[]
  votes: RecordData<VoteData>[]
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const t = tally(quotes.map((q) => q.data))
  const verdict = verdictOf(t)
  const tone = toneOf(verdict)

  const shown = useMemo(() => {
    const kept = quotes.filter((q) => q.data.status === 'kept')
    const removed = quotes.filter((q) => q.data.status === 'removed')
    if (filter === 'removed') return removed
    if (filter === 'push' || filter === 'support') return kept.filter((q) => q.data.stance === filter)
    return [...kept.sort((a, b) => (a.data.stance === b.data.stance ? 0 : a.data.stance === 'push' ? -1 : 1)), ...removed]
  }, [quotes, filter])

  const pills: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: quotes.length },
    { id: 'push', label: 'Push back', count: t.push },
    { id: 'support', label: 'Support', count: t.support },
    { id: 'removed', label: 'Removed', count: t.removed },
  ]

  return (
    <aside aria-label={`Evidence for claim ${claim.index}`} className="flex min-w-0 flex-col overflow-hidden panel lg:sticky lg:top-6 lg:max-h-[calc(100vh-48px)]">
      <div className="panel-header shrink-0 px-[22px] pt-5 pb-4">
        <p className={cn('m-0 mb-1 text-[15px] font-semibold', tone.label)}>
          Claim {claim.index}, {VERDICT_LABEL[verdict]}
        </p>
        <h2 className="m-0 text-xl font-semibold leading-snug tracking-[-0.015em]">{claim.text}</h2>
        <p className="m-0 mt-2 text-[15px] text-muted-foreground">
          Verified means the sentence was found word for word on the linked page. Removed quotes were suggested by the AI but failed that check.
        </p>
        <div role="group" aria-label="Filter quotes" className="mt-3.5 flex flex-wrap gap-1.5">
          {pills.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={filter === p.id}
              onClick={() => setFilter(p.id)}
              className={cn(
                'min-h-9 cursor-pointer rounded-[18px] px-3 text-[15px]',
                filter === p.id ? 'bg-primary font-medium text-primary-foreground' : 'border border-border bg-card text-foreground hover:bg-background',
              )}
            >
              {p.label} {p.count}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="m-0 px-[22px] py-6 text-[15px] text-muted-foreground">
          {quotes.length === 0
            ? 'No developer discussion found. Either few developers care, or the claim is worded differently from how they talk. Reword it and run the trial again.'
            : 'Nothing in this filter.'}
        </p>
      ) : (
        <ol className="m-0 min-h-0 list-none overflow-y-auto p-0 [&>li:first-child]:border-t-0">
          {shown.map((q) => (
            <QuoteItem key={q.recordId} quote={q} votes={votes.filter((v) => v.data.quoteId === voteKey(q))} />
          ))}
        </ol>
      )}
    </aside>
  )
}

function formatDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function QuoteItem({ quote, votes }: { quote: RecordData<QuoteData>; votes: RecordData<VoteData>[] }) {
  const q = quote.data
  const { userId } = useAuth()
  const { ready, create, put, remove } = useMutations<VoteData>('votes')
  const mine = votes.find((v) => v.data.userId === userId)
  const count = (value: VoteData['value']) => votes.filter((v) => v.data.value === value).length

  function vote(value: VoteData['value']) {
    if (!userId) return
    // Same button again takes the vote back; the other button changes it.
    if (mine?.data.value === value) remove(mine.recordId)
    else if (mine) put(mine.recordId, { value })
    else create({ quoteId: voteKey(quote), userId, value })
  }

  if (q.status === 'removed') {
    return (
      <li className="border-t border-rule bg-background px-[22px] py-[18px]">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[15px] text-muted-foreground">
          <span className="rounded-md bg-border px-2 py-0.5 font-semibold text-ink-soft">Removed</span>
          {q.removeReason}
        </div>
        <blockquote className="m-0 text-[17px] leading-relaxed text-muted-foreground line-through">{q.text}</blockquote>
      </li>
    )
  }

  const stanceBadge = q.stance === 'push' ? 'bg-push-tint text-push-badge' : 'bg-support-tint text-support-badge'
  return (
    <li className="border-t border-rule px-[22px] py-[18px]">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[15px] text-muted-foreground">
        <span className={cn('rounded-md px-2 py-0.5 font-semibold', stanceBadge)}>{STANCE_LABEL[q.stance]}</span>
        <span>
          {q.site}
          {q.postedAt ? `, ${formatDate(q.postedAt)}` : ''}
        </span>
        <span className="flex items-center gap-1 text-verified">
          <Check className="size-3.5" aria-hidden />
          Verified
        </span>
        {q.reusedFrom && <span>From an earlier trial</span>}
      </div>
      <blockquote className="m-0 text-[17px] leading-relaxed">{q.text}</blockquote>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {(['relevant', 'off_topic'] as const).map((value) => (
          <button
            key={value}
            type="button"
            disabled={!ready || !userId}
            aria-pressed={mine?.data.value === value}
            onClick={() => vote(value)}
            className={cn(
              'min-h-9 cursor-pointer rounded-lg px-3 text-[15px] disabled:cursor-not-allowed disabled:opacity-50',
              mine?.data.value === value ? 'bg-primary font-semibold text-primary-foreground' : 'border border-border bg-card hover:bg-background',
            )}
          >
            {value === 'relevant' ? 'Relevant' : 'Off-topic'} {count(value)}
          </button>
        ))}
        <a href={q.sourceUrl} target="_blank" rel="noreferrer noopener" className="ml-auto text-[15px] font-medium text-support hover:text-foreground">
          Open thread
        </a>
      </div>
    </li>
  )
}

/**
 * The Claims panel after a trial: one row per claim with its counts and a
 * thin split bar (orange = push back, blue = support). Selecting a row shows
 * its evidence.
 */

import { tallyLine, verdictOf, type ClaimTally } from '../lib/evidence'
import { cn } from '../lib/utils'
import { toneOf } from './tone'

export interface ClaimRow {
  id: string
  index: number
  text: string
  tally: ClaimTally
}

export function ClaimRows({
  claims,
  selectedId,
  onSelect,
  status,
}: {
  claims: ClaimRow[]
  selectedId: string | null
  onSelect: (id: string) => void
  status: React.ReactNode
}) {
  return (
    <section aria-label="Claims" className="overflow-hidden panel">
      <div className="panel-header flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-[22px] py-4">
        <h2 className="m-0 text-[17px] font-semibold">Claims</h2>
        <div className="text-[15px] text-muted-foreground">{status}</div>
      </div>
      {claims.map((c) => {
        const tone = toneOf(verdictOf(c.tally))
        const selected = c.id === selectedId
        const total = c.tally.push + c.tally.support + c.tally.removed
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(c.id)}
            className={cn(
              'flex min-h-16 w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-3 border-0 border-t border-rule first-of-type:border-t-0 px-[22px] py-3.5 text-left transition-colors',
              selected ? tone.row : 'bg-card hover:bg-background',
            )}
          >
            <span className={cn('flex h-[26px] w-[26px] items-center justify-center rounded-lg text-[15px] font-bold', tone.badge)}>
              {c.index}
            </span>
            <span className="min-w-0 flex-[1_1_260px]">
              <span className="block font-semibold">{c.text}</span>
              <span className="block text-[15px] text-muted-foreground">{tallyLine(c.tally)}</span>
            </span>
            <span aria-hidden="true" className="flex h-1.5 flex-[0_0_160px] overflow-hidden rounded-[3px] bg-rule">
              {total > 0 && (
                <>
                  <span className="bg-push" style={{ width: `${(c.tally.push / total) * 100}%` }} />
                  <span className="bg-support" style={{ width: `${(c.tally.support / total) * 100}%` }} />
                </>
              )}
            </span>
          </button>
        )
      })}
    </section>
  )
}

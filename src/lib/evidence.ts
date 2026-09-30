/**
 * Counts shown on the board, derived from quote records.
 * Counts are never stored, so there is nothing a client could inflate:
 * the board always shows exactly what the quotes collection contains.
 */

import type { QuoteData, Stance } from '../types'

export interface ClaimTally {
  push: number
  support: number
  removed: number
}

export type Verdict = 'pushback' | 'support' | 'mixed' | 'none'

export function tally(quotes: Pick<QuoteData, 'stance' | 'status'>[]): ClaimTally {
  const t: ClaimTally = { push: 0, support: 0, removed: 0 }
  for (const q of quotes) {
    if (q.status === 'removed') t.removed++
    else t[q.stance === 'push' ? 'push' : 'support']++
  }
  return t
}

/** "Mostly pushback" needs a clear majority; anything close is "mixed". */
export function verdictOf(t: ClaimTally): Verdict {
  const kept = t.push + t.support
  if (kept === 0) return 'none'
  if (t.push >= kept * 0.6) return 'pushback'
  if (t.support >= kept * 0.6) return 'support'
  return 'mixed'
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  pushback: 'mostly pushback',
  support: 'mostly support',
  mixed: 'mixed evidence',
  none: 'no developer discussion found',
}

export function tallyLine(t: ClaimTally): string {
  if (t.push + t.support + t.removed === 0) return 'No developer discussion found'
  return `${t.push} push back, ${t.support} support, ${t.removed} removed`
}

export const STANCE_LABEL: Record<Stance, string> = { push: 'Push back', support: 'Support' }

/**
 * The message under test, with each claim's span marked like a highlighter
 * stroke in its verdict colour. Clicking a mark selects the claim.
 */

import type { Verdict } from '../lib/evidence'
import { cn } from '../lib/utils'
import { toneOf } from './tone'

export interface MarkedClaim {
  id: string
  index: number
  span: string
  verdict: Verdict
}

interface Segment {
  text: string
  claim?: MarkedClaim
}

/** Split the message into plain and marked segments. Overlapping or unfound spans are left unmarked. */
export function segmentMessage(message: string, claims: MarkedClaim[]): Segment[] {
  const lower = message.toLowerCase()
  const found = claims
    .map((claim) => {
      // Spans were verified against the message after normalization, so fall back to a case-insensitive match.
      let start = message.indexOf(claim.span)
      if (start < 0) start = lower.indexOf(claim.span.toLowerCase())
      return { claim, start, end: start + claim.span.length }
    })
    .filter((f) => f.start >= 0)
    .sort((a, b) => a.start - b.start)

  const segments: Segment[] = []
  let cursor = 0
  for (const f of found) {
    if (f.start < cursor) continue
    if (f.start > cursor) segments.push({ text: message.slice(cursor, f.start) })
    segments.push({ text: message.slice(f.start, f.end), claim: f.claim })
    cursor = f.end
  }
  if (cursor < message.length) segments.push({ text: message.slice(cursor) })
  return segments
}

export function MarkedMessage({
  message,
  claims,
  selectedId,
  onSelect,
}: {
  message: string
  claims: MarkedClaim[]
  selectedId?: string | null
  onSelect?: (claimId: string) => void
}) {
  return (
    <p className="m-0 max-w-[24ch] text-[clamp(28px,3.2vw,42px)] font-semibold leading-[1.38] tracking-[-0.025em] text-foreground">
      {segmentMessage(message, claims).map((seg, i) => {
        if (!seg.claim) return <span key={i}>{seg.text}</span>
        const tone = toneOf(seg.claim.verdict)
        const selected = seg.claim.id === selectedId
        return (
          <span key={i}>
            <button
              type="button"
              aria-pressed={selected}
              aria-label={`Claim ${seg.claim.index}: ${seg.text}`}
              onClick={() => onSelect?.(seg.claim!.id)}
              className={cn(
                'cursor-pointer text-left [box-decoration-break:clone] [-webkit-box-decoration-break:clone] focus-visible:outline-2 focus-visible:outline-ring',
                tone.mark,
                selected && tone.outline,
              )}
            >
              {seg.text}
            </button>
            <sup className={cn('ml-1 text-[13px] font-bold', tone.number)}>{seg.claim.index}</sup>
          </span>
        )
      })}
    </p>
  )
}

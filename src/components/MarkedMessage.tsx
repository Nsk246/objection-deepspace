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

const SIZES = {
  // Board: big enough to read as "the thing on trial", small enough to leave room for the evidence.
  lg: 'text-[clamp(22px,2.1vw,30px)] leading-[1.55]',
  md: 'text-[clamp(20px,1.8vw,26px)] leading-[1.55]',
}

export function MarkedMessage({
  message,
  claims,
  selectedId,
  onSelect,
  size = 'lg',
}: {
  message: string
  claims: MarkedClaim[]
  selectedId?: string | null
  onSelect?: (claimId: string) => void
  size?: keyof typeof SIZES
}) {
  return (
    <p className={cn('m-0 max-w-[36ch] font-semibold tracking-[-0.02em] text-foreground', SIZES[size])}>
      {segmentMessage(message, claims).map((seg, i) => {
        if (!seg.claim) return <span key={i}>{seg.text}</span>
        const tone = toneOf(seg.claim.verdict)
        const selected = seg.claim.id === selectedId
        // Keep the claim number glued to the last word, so it never wraps onto a line by itself.
        const lastSpace = seg.text.lastIndexOf(' ')
        const head = lastSpace > 0 ? seg.text.slice(0, lastSpace + 1) : ''
        const tail = lastSpace > 0 ? seg.text.slice(lastSpace + 1) : seg.text
        return (
          // A <mark> rather than a <button>: browsers lay buttons out as blocks, which breaks
          // a highlight that wraps across lines. Role, tab stop and keys make it a real button.
          <mark
            key={i}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={`Claim ${seg.claim.index}: ${seg.text}`}
            onClick={() => onSelect?.(seg.claim!.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.(seg.claim!.id)
              }
            }}
            className={cn(
              'cursor-pointer rounded-[4px] text-inherit [box-decoration-break:clone] [-webkit-box-decoration-break:clone]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              tone.mark,
              selected && tone.selected,
            )}
          >
            {head}
            <span className="whitespace-nowrap">
              {tail}
              <sup className={cn('ml-0.5 text-[0.45em] font-bold', tone.number)}>{seg.claim.index}</sup>
            </span>
          </mark>
        )
      })}
    </p>
  )
}

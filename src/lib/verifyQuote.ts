/**
 * The verbatim gate.
 *
 * The AI may paraphrase or invent. These functions decide what counts as
 * evidence: a quote survives only if it appears word for word in the page
 * text we fetched. The same check keeps claim spans honest (the span must be
 * an exact part of the message under test).
 */

import { config } from '../config'

// Named entities that show up in HN comment HTML and dev.to text.
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '-',
  mdash: '-',
  hellip: '...',
  lsquo: "'",
  rsquo: "'",
  ldquo: '"',
  rdquo: '"',
}

/** Decode `&amp;`, `&#39;`, `&#x27;` and the named entities above. Unknown names stay as-is. */
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match
  })
}

/**
 * Strip tags, decode entities, and collapse differences that are formatting, not wording.
 * Markdown marks (`code`, **bold**, _em_, [link](url)) are dropped on both sides: page text
 * from GitHub and dev.to keeps them, and the model usually copies the words without them.
 */
export function normalize(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, ' '))
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .toLowerCase()
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
}

/** True only if `quote` appears word for word in `sourceText` (after normalization). */
export function isVerbatim(quote: string, sourceText: string): boolean {
  const q = normalize(quote)
  if (q.length < config.quotes.minChars) return false
  return normalize(sourceText).includes(q)
}

/** Why a quote failed, in words a teammate can read on the evidence board. */
export function rejectionReason(quote: string, sourceText: string): string | null {
  if (normalize(quote).length < config.quotes.minChars) return 'Too short to count as evidence'
  if (!isVerbatim(quote, sourceText)) return 'Not on the source page'
  return null
}

/** Claim spans are shorter than quotes, so they only need to be a non-empty exact part of the message. */
export function isExactSpan(span: string, message: string): boolean {
  const s = normalize(span)
  return s.length > 0 && normalize(message).includes(s)
}

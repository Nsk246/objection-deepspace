/**
 * Proof that the verbatim gate keeps real quotes and rejects everything else.
 * If any of these fail, invented evidence could reach the board.
 */

import { describe, expect, it } from 'vitest'
import { decodeEntities, isExactSpan, isVerbatim, normalize, rejectionReason } from './verifyQuote'

const page =
  'I tried three agents last month. The agent gets me to a demo in an afternoon. ' +
  'Getting from demo to something I would let real users log into took two more weeks.'

describe('isVerbatim', () => {
  it('keeps an exact quote', () => {
    expect(isVerbatim('The agent gets me to a demo in an afternoon.', page)).toBe(true)
  })

  it('keeps a quote that differs only in whitespace, case and curly quotes', () => {
    const source = 'It’s   great for\n demos, but auth is where it  falls apart.'
    expect(isVerbatim("it's great for demos, but AUTH is where it falls apart.", source)).toBe(true)
  })

  it('rejects a paraphrase', () => {
    expect(isVerbatim('The agent gets me a demo within one afternoon.', page)).toBe(false)
  })

  it('rejects an invented sentence', () => {
    expect(isVerbatim('AI agents cannot handle authentication at all.', page)).toBe(false)
  })

  it('rejects a fragment too short to be evidence, even when it matches', () => {
    expect(isVerbatim('a demo', page)).toBe(false)
  })

  it('keeps a quote from an HTML-encoded source (Hacker News comment HTML)', () => {
    const hn = '<p>I don&#x27;t trust it with auth.<p>Every time I let it write the auth flow, I end up auditing it line by line &amp; rewriting half.'
    expect(isVerbatim("Every time I let it write the auth flow, I end up auditing it line by line & rewriting half.", hn)).toBe(true)
    expect(isVerbatim("I don't trust it with auth. Every time I let it write", hn)).toBe(true)
  })

  it('rejects a quote stitched together from two separate places on the page', () => {
    expect(isVerbatim('The agent gets me to a demo in two more weeks.', page)).toBe(false)
  })
})

describe('rejectionReason', () => {
  it('explains each kind of failure', () => {
    expect(rejectionReason('a demo', page)).toBe('Too short to count as evidence')
    expect(rejectionReason('AI agents cannot handle authentication at all.', page)).toBe('Not on the source page')
    expect(rejectionReason('The agent gets me to a demo in an afternoon.', page)).toBeNull()
  })
})

describe('helpers', () => {
  it('decodes numeric and named entities, and leaves unknown ones alone', () => {
    expect(decodeEntities('a &amp; b &#39;c&#x27; &quot;d&quot; &bogus;')).toBe('a & b \'c\' "d" &bogus;')
  })

  it('normalizes tags, dashes and ellipses', () => {
    expect(normalize('<i>Wait</i>— really…')).toBe('wait - really...')
  })

  it('checks claim spans against the message', () => {
    const message = 'Your coding agent can ship a production app today. Auth, data, permissions and payments come built in.'
    expect(isExactSpan('Auth, data, permissions', message)).toBe(true)
    expect(isExactSpan('Auth and data', message)).toBe(false)
    expect(isExactSpan('   ', message)).toBe(false)
  })
})

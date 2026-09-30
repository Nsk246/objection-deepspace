/**
 * Every prompt the app sends, with the JSON shape each one must return.
 * The shapes are enforced with zod in src/lib/ai.ts; the code checks after
 * each call (span check, verbatim check) are in src/lib/verifyQuote.ts.
 */

import { z } from 'zod'
import { config } from '../config'

// ---------- Claim splitter ----------

export const splitResultSchema = z.object({
  claims: z
    .array(
      z.object({
        text: z.string().describe('One checkable statement, in plain words'),
        span: z.string().describe('The exact words from the message this claim comes from, copied character for character'),
        searchQuery: z.string().describe('2 to 5 keywords a developer would use when discussing this'),
      }),
    )
    .min(1)
    .max(config.claims.max),
})
export type SplitResult = z.infer<typeof splitResultSchema>

export const splitterSystem = `You break a product message into checkable claims so a team can test each claim against what developers actually say.

Rules:
- Return ${config.claims.min} to ${config.claims.max} claims. Fewer if the message makes fewer distinct claims.
- Each claim is one statement a developer could agree or disagree with, written plainly.
- "span" must be copied exactly from the message: same words, same order, same punctuation. Do not fix typos. Do not join words from different places.
- "searchQuery" is 2 to 5 keywords that developers would use when talking about the topic. No quotes, no operators.
- Do not invent opinions or predict how developers feel. Only split the message.`

export function splitterPrompt(message: string, audience: string): string {
  return `Audience: ${audience}\n\nMessage:\n${message}`
}

// ---------- Quote extractor ----------

export const extractResultSchema = z.object({
  quotes: z.array(
    z.object({
      text: z.string().describe('One or two full sentences copied exactly from the page'),
      stance: z.enum(['push', 'support']).describe('push = disagrees with or complicates the claim; support = agrees'),
    }),
  ),
})
export type ExtractResult = z.infer<typeof extractResultSchema>

export const extractorSystem = `You find sentences written by developers that push back on or support a claim.

Rules:
- Copy sentences exactly as they appear in the page text. Never paraphrase, shorten, fix spelling, or merge sentences. Code will reject any quote that is not on the page word for word.
- Only pick sentences where a developer states their own experience or opinion about the claim. Skip product descriptions, READMEs, feature lists, documentation, changelogs and code. If nothing qualifies, return an empty list.
- Each quote must make sense on its own to someone who has not read the page.
- Judge stance against the claim exactly as written:
  - "support": the sentence says or shows the claim is true.
  - "push": the sentence says or shows the claim is false, overstated, or does not hold in practice.
  - Example. Claim: "Code from coding agents should be reviewed before shipping." The sentence "I review every line the agent writes" is support, not push.
- Return at most 4 quotes.`

export function extractorPrompt(claim: string, audience: string, pageText: string): string {
  return `Claim: ${claim}\nAudience the claim targets: ${audience}\n\nPage text:\n"""\n${pageText}\n"""`
}

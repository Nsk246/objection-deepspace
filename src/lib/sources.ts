/**
 * The scout: plain code, no AI. Finds recent developer discussion for a
 * claim and returns the page text we will later verify quotes against.
 *
 * Sources:
 *   - Hacker News via the free Algolia API. Returns exact comment text (as HTML).
 *   - Exa search through the DeepSpace integration proxy, limited to developer
 *     venues. Returns page text in the same call (`contents.text`).
 */

import { config } from '../config'

export interface SourcePage {
  url: string
  site: string
  postedAt: string | null
  /** The text quotes are verified against. May contain HTML; verifyQuote strips it. */
  text: string
}

/** Calls an integration endpoint and returns its `data` payload. */
export type IntegrationCall = (endpoint: string, params: Record<string, unknown>) => Promise<unknown>

function sinceDate(): Date {
  return new Date(Date.now() - config.sources.recencyDays * 24 * 60 * 60 * 1000)
}

interface HnHit {
  objectID: string
  comment_text?: string | null
  created_at?: string
}

export async function searchHackerNews(query: string, signal: AbortSignal): Promise<SourcePage[]> {
  const since = Math.floor(sinceDate().getTime() / 1000)
  const url = new URL('https://hn.algolia.com/api/v1/search')
  url.searchParams.set('query', query)
  url.searchParams.set('tags', 'comment')
  url.searchParams.set('numericFilters', `created_at_i>${since}`)
  url.searchParams.set('hitsPerPage', String(config.sources.hnCommentsPerClaim))

  // Identify ourselves; some APIs refuse anonymous server-to-server requests.
  const res = await fetch(url, { signal, headers: { 'User-Agent': 'Objection (https://objection.app.space)' } })
  if (!res.ok) throw new Error(`Hacker News search failed (${res.status})`)
  const body = (await res.json()) as { hits?: HnHit[] }

  return (body.hits ?? [])
    .filter((h) => h.comment_text)
    .map((h) => ({
      url: `https://news.ycombinator.com/item?id=${h.objectID}`,
      site: 'Hacker News',
      postedAt: h.created_at ?? null,
      text: h.comment_text as string,
    }))
}

interface ExaResult {
  url?: string
  publishedDate?: string | null
  text?: string | null
}

export async function searchExa(query: string, call: IntegrationCall): Promise<SourcePage[]> {
  const data = (await call('exa/search', {
    query,
    numResults: config.sources.exaResultsPerClaim,
    includeDomains: [...config.sources.exaDomains],
    startPublishedDate: sinceDate().toISOString(),
    contents: { text: { maxCharacters: config.sources.maxPageChars } },
  })) as { results?: ExaResult[] } | undefined

  // The proxy's response shape is not documented; say so loudly rather than find nothing quietly.
  if (!Array.isArray(data?.results)) {
    console.warn(`[exa] unexpected response shape, keys: ${data && typeof data === 'object' ? Object.keys(data).join(',') : typeof data}`)
    return []
  }
  const withText = data.results.filter((r) => r.text).length
  if (data.results.length > 0 && withText === 0) console.warn(`[exa] ${data.results.length} results but none carried text`)

  return data.results
    // Only http(s) links: the URL becomes an "Open thread" link on the board.
    .filter((r): r is ExaResult & { url: string; text: string } => Boolean(r.url && /^https?:\/\//i.test(r.url) && r.text))
    .filter((r) => isDiscussion(r.url))
    .map((r) => ({
      url: r.url,
      site: siteName(r.url),
      postedAt: r.publishedDate ?? null,
      text: r.text,
    }))
}

export function siteName(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, '')
  if (host === 'news.ycombinator.com') return 'Hacker News'
  if (host === 'github.com') return 'GitHub'
  return host
}

/**
 * GitHub search mostly returns READMEs, where a project describes itself. That is
 * marketing, not a developer's experience, so only issues, discussions and pull
 * request threads count. Other venues (dev.to posts and comments) pass through.
 */
export function isDiscussion(url: string): boolean {
  const u = new URL(url)
  if (u.hostname.replace(/^www\./, '') !== 'github.com') return true
  return /^\/[^/]+\/[^/]+\/(issues|discussions|pull)\/\d+/.test(u.pathname)
}

/**
 * Record shapes (the `data` part of each envelope), shared by the worker and the UI.
 * Column rules live in src/schemas/objection-schemas.ts.
 */

export type VersionStatus = 'draft' | 'splitting' | 'claims_ready' | 'running' | 'done' | 'failed'
export type Stance = 'push' | 'support'

export interface CaseData {
  title: string
  audience: string
}

export interface VersionData {
  caseId: string
  number: number
  message: string
  status: VersionStatus
  jobId?: string
  error?: string
  finishedAt?: string
  pagesRead?: number
}

export interface ClaimData {
  caseId: string
  versionId: string
  index: number
  text: string
  span: string
  searchQuery: string
  claimKey: string
  status: 'draft' | 'approved' | 'dropped'
}

export interface QuoteData {
  caseId: string
  versionId: string
  claimId: string
  claimKey: string
  text: string
  stance: Stance
  status: 'kept' | 'removed'
  removeReason?: string
  sourceUrl: string
  site: string
  postedAt?: string
  fetchedAt: string
  reusedFrom?: string
}

export interface VoteData {
  quoteId: string
  userId: string
  value: 'relevant' | 'off_topic'
}

export interface UsageData {
  userId: string
  day: string
  trials: number
  splits: number
}

/** Matching key for evidence memory: same words, ignoring case and punctuation. */
export function claimKeyOf(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** UTC day, used for the per-user daily caps. */
export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

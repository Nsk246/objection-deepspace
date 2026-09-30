/**
 * Every tunable in one place: models, sources, limits.
 * Change behavior here, not inside the pipeline code.
 */

export const config = {
  models: {
    // Claim splitting needs judgment about what is checkable; one call per version.
    splitter: 'claude-sonnet-5',
    // Extraction runs once per fetched page, so it uses the fast, cheaper model.
    extractor: 'claude-haiku-4-5',
  },

  claims: {
    min: 3,
    max: 5,
  },

  sources: {
    // Only look at discussion from the last N days, so evidence is current.
    recencyDays: 90,
    // Hacker News comments per claim (free API, exact comment text).
    hnCommentsPerClaim: 8,
    // Exa results per claim, limited to developer venues.
    exaResultsPerClaim: 4,
    exaDomains: ['dev.to', 'github.com'],
    // Cap page text sent to the extractor, to bound AI cost per page.
    maxPageChars: 12_000,
  },

  quotes: {
    // Kept quotes per claim; the extractor may return more, we stop here.
    maxPerClaim: 8,
    // Quotes shorter than this match almost anything, so they are not evidence.
    minChars: 25,
  },

  memory: {
    // Reuse a claim's earlier verified quotes if they are this fresh.
    freshDays: 7,
  },

  limits: {
    // Trials search the web and run AI on the owner's credits.
    trialsPerUserPerDay: 5,
    // Claim splits are one cheap AI call, but still capped.
    splitsPerUserPerDay: 20,
    messageMaxChars: 600,
    audienceMaxChars: 160,
    claimMaxChars: 240,
    // Hard stop for one trial run, including all network calls.
    trialDeadlineMs: 12 * 60 * 1000,
  },
} as const

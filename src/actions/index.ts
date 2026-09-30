/**
 * Server actions: the only way a client can spend owner credits.
 *
 * Both run as the app (RBAC off), after the worker has verified the caller's
 * JWT. Each one validates state, checks the caller's daily cap, and only then
 * spends anything. Exposed at POST /api/actions/<name>.
 *
 *   splitClaims  one AI call; writes claims (clients cannot create claims)
 *   startTrial   enqueues the run-trial job (clients cannot enqueue jobs)
 */

import { enqueueJob } from 'deepspace/worker'
import type { ActionHandler, ActionResult, ActionTools } from 'deepspace/worker'
import type { Env } from '../../worker'
import { config } from '../config'
import { splitIntoClaims } from '../lib/ai'
import { isExactSpan } from '../lib/verifyQuote'
import { claimKeyOf, todayKey, type CaseData, type ClaimData, type UsageData, type VersionData } from '../types'

type Usage = Pick<UsageData, 'trials' | 'splits'>

async function getData<T extends Record<string, unknown>>(tools: ActionTools, collection: string, id: string): Promise<T | null> {
  const res = await tools.get<T>(collection, id)
  return res.success ? res.data.record.data : null
}

// One row per user per day, keyed so reads and writes need no query.
function usageId(userId: string): string {
  return `${userId}:${todayKey()}`
}

async function readUsage(tools: ActionTools, userId: string): Promise<Usage> {
  const row = await getData<Record<string, unknown>>(tools, 'usage', usageId(userId))
  return { trials: Number(row?.trials ?? 0), splits: Number(row?.splits ?? 0) }
}

async function writeUsage(tools: ActionTools, userId: string, usage: Usage): Promise<void> {
  // create() with a known id upserts, merging into today's row.
  await tools.create('usage', { userId, day: todayKey(), ...usage }, usageId(userId))
}

function fail(error: string): ActionResult {
  return { success: false, error }
}

const splitClaims: ActionHandler<Env> = async ({ userId, params, tools, env }) => {
  const versionId = typeof params.versionId === 'string' ? params.versionId : ''
  const version = versionId ? await getData<VersionData & Record<string, unknown>>(tools, 'versions', versionId) : null
  if (!version) return fail('Version not found.')
  if (version.status !== 'draft') return fail('Claims were already split for this version.')
  if (version.message.length > config.limits.messageMaxChars) {
    return fail(`The message is longer than ${config.limits.messageMaxChars} characters. Shorten it and try again.`)
  }
  const caseData = await getData<CaseData & Record<string, unknown>>(tools, 'cases', version.caseId)
  if (!caseData) return fail('Case not found.')

  const usage = await readUsage(tools, userId)
  if (usage.splits >= config.limits.splitsPerUserPerDay) {
    return fail(`You have split ${config.limits.splitsPerUserPerDay} messages today, the daily limit. Try again tomorrow.`)
  }

  // Mark first, so a double click cannot run two paid splits.
  await tools.update('versions', versionId, { status: 'splitting', error: '' })
  await writeUsage(tools, userId, { ...usage, splits: usage.splits + 1 })

  try {
    const result = await splitIntoClaims(env, version.message, caseData.audience)
    // Code check: a claim whose span is not in the message is dropped, not shown.
    const valid = result.claims.filter((c) => isExactSpan(c.span, version.message)).slice(0, config.claims.max)
    if (valid.length === 0) {
      await tools.update('versions', versionId, { status: 'draft', error: 'No claim could be tied to exact words in the message. Try again, or reword the message.' })
      return fail('No valid claims were found.')
    }
    for (const [index, c] of valid.entries()) {
      const claim: ClaimData = {
        caseId: version.caseId,
        versionId,
        index: index + 1,
        text: c.text.slice(0, config.limits.claimMaxChars),
        span: c.span,
        searchQuery: c.searchQuery.slice(0, 120),
        claimKey: claimKeyOf(c.text),
        status: 'draft',
      }
      await tools.create('claims', { ...claim })
    }
    await tools.update('versions', versionId, { status: 'claims_ready' })
    return { success: true, data: { claims: valid.length, rejected: result.claims.length - valid.length } }
  } catch (err) {
    console.error('[splitClaims] failed', err)
    await tools.update('versions', versionId, { status: 'draft', error: 'Splitting the message failed. Try again.' })
    return fail('Splitting the message failed. Try again.')
  }
}

const startTrial: ActionHandler<Env> = async ({ userId, params, tools, env }) => {
  const versionId = typeof params.versionId === 'string' ? params.versionId : ''
  const version = versionId ? await getData<VersionData & Record<string, unknown>>(tools, 'versions', versionId) : null
  if (!version) return fail('Version not found.')
  if (version.status !== 'claims_ready' && version.status !== 'failed') {
    return fail(version.status === 'running' ? 'A trial is already running for this version.' : 'Split and approve claims before running a trial.')
  }

  const claims = await tools.query('claims', { where: { versionId, status: 'approved' }, limit: config.claims.max })
  if (!claims.success || claims.data.records.length === 0) return fail('Approve at least one claim first.')

  const usage = await readUsage(tools, userId)
  if (usage.trials >= config.limits.trialsPerUserPerDay) {
    return fail(`You have run ${config.limits.trialsPerUserPerDay} trials today, the daily limit. Try again tomorrow.`)
  }

  await tools.update('versions', versionId, { status: 'running', error: '' })
  await writeUsage(tools, userId, { ...usage, trials: usage.trials + 1 })

  // One named job type with a server-built payload; the caller chooses neither.
  const jobId = await enqueueJob(env.JOB_ROOMS, `app:${env.DEEPSPACE_APP_ID}`, 'run-trial', { versionId }, { maxAttempts: 1, enqueuedBy: userId })
  await tools.update('versions', versionId, { jobId })
  return { success: true, data: { jobId, trialsLeft: config.limits.trialsPerUserPerDay - usage.trials - 1 } }
}

export const actions: Record<string, ActionHandler<Env>> = { splitClaims, startTrial }

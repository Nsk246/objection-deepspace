/**
 * Objection collections and who may write them.
 *
 * Team model for v1: the app is the team. Every signed-in member reads every
 * case. There is no per-case sharing.
 *
 * Trust rules, enforced in the RecordRoom Durable Object (not the UI):
 *   - claims and quotes are created only by worker code (server actions and
 *     the trial job, which bypass RBAC). A client cannot forge a claim span or
 *     a "verified" quote.
 *   - votes are one per user per quote, and a user can only write their own.
 *   - usage (daily trial counts) is written only by worker code.
 */

import type { CollectionSchema } from 'deepspace/schema'

const text = (name: string, extra: Partial<CollectionSchema['columns'][number]> = {}) =>
  ({ name, storage: 'text', interpretation: 'plain', ...extra }) as const
const num = (name: string) => ({ name, storage: 'number', interpretation: 'plain' }) as const
const select = (name: string, options: string[]) =>
  ({ name, storage: 'text', interpretation: { kind: 'select', options } }) as const

// Server-written collections: members read, nobody writes from a client.
const serverWritten = {
  viewer: { read: false, create: false, update: false, delete: false },
  member: { read: true, create: false, update: false, delete: false },
  admin: { read: true, create: false, update: false, delete: false },
} as const

export const casesSchema: CollectionSchema = {
  name: 'cases',
  columns: [text('title', { required: true }), text('audience', { required: true })],
  permissions: {
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: true, create: true, update: true, delete: 'own', writableFields: ['title', 'audience'] },
    admin: { read: true, create: true, update: true, delete: true, writableFields: ['title', 'audience'] },
  },
}

export const VERSION_STATUSES = ['draft', 'splitting', 'claims_ready', 'running', 'done', 'failed'] as const

export const versionsSchema: CollectionSchema = {
  name: 'versions',
  columns: [
    text('caseId', { required: true, immutable: true }),
    num('number'),
    text('message', { required: true, immutable: true }),
    { ...select('status', [...VERSION_STATUSES]), default: 'draft' },
    text('jobId'),
    text('error'),
    text('finishedAt'),
    // Pages the scout read in the last run (quote counts are derived from quotes).
    num('pagesRead'),
  ],
  permissions: {
    viewer: { read: false, create: false, update: false, delete: false },
    // Members create a version; status moves only through server actions and the job.
    member: { read: true, create: true, update: false, delete: 'own', writableFields: ['caseId', 'number', 'message'] },
    admin: { read: true, create: true, update: false, delete: true, writableFields: ['caseId', 'number', 'message'] },
  },
}

export const claimsSchema: CollectionSchema = {
  name: 'claims',
  columns: [
    text('caseId', { immutable: true }),
    text('versionId', { immutable: true }),
    num('index'),
    // The checkable statement. The team may reword it before the trial.
    text('text'),
    // The exact part of the message this claim came from. Never editable.
    text('span', { immutable: true }),
    // Keywords the scout searches with. The team may edit them with the claim.
    text('searchQuery'),
    // Normalized claim text, used to find the team's earlier evidence.
    text('claimKey'),
    select('status', ['draft', 'approved', 'dropped']),
  ],
  permissions: {
    viewer: { read: false, create: false, update: false, delete: false },
    // Team edits wording and approves claims; only the splitter creates them.
    member: { read: true, create: false, update: true, delete: false, writableFields: ['text', 'searchQuery', 'status'] },
    admin: { read: true, create: false, update: true, delete: true, writableFields: ['text', 'searchQuery', 'status'] },
  },
}

export const quotesSchema: CollectionSchema = {
  name: 'quotes',
  columns: [
    text('caseId'),
    text('versionId'),
    text('claimId'),
    text('claimKey'),
    text('text'),
    select('stance', ['push', 'support']),
    select('status', ['kept', 'removed']),
    text('removeReason'),
    text('sourceUrl'),
    text('site'),
    text('postedAt'),
    text('fetchedAt'),
    // Set when this quote was carried over from an earlier trial (evidence memory).
    text('reusedFrom'),
    text('why'),
  ],
  permissions: serverWritten,
}

export const votesSchema: CollectionSchema = {
  name: 'votes',
  columns: [
    text('quoteId', { required: true, immutable: true }),
    text('userId', { userBound: true, immutable: true }),
    select('value', ['relevant', 'off_topic']),
  ],
  uniqueOn: ['quoteId', 'userId'],
  ownerField: 'userId',
  permissions: {
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: true, create: true, update: 'own', delete: 'own', writableFields: ['quoteId', 'userId', 'value'] },
    admin: { read: true, create: true, update: 'own', delete: 'own', writableFields: ['quoteId', 'userId', 'value'] },
  },
}

export const usageSchema: CollectionSchema = {
  name: 'usage',
  columns: [text('userId', { userBound: true }), text('day'), num('trials'), num('splits')],
  ownerField: 'userId',
  permissions: {
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: 'own', create: false, update: false, delete: false },
    admin: { read: 'own', create: false, update: false, delete: false },
  },
}

export const objectionSchemas = [casesSchema, versionsSchema, claimsSchema, quotesSchema, votesSchema, usageSchema]

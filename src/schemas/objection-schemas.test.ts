/**
 * The trust rules, checked with the SDK's own permission functions (the same
 * ones the RecordRoom runs). If one of these fails, a client could forge
 * evidence or vote twice.
 */

import { describe, expect, it } from 'vitest'
import { canCreate, canUpdate, checkFieldPermissions, lintSchemas } from 'deepspace/worker'
import { schemas } from '../schemas'
import { claimsSchema, quotesSchema, usageSchema, versionsSchema, votesSchema } from './objection-schemas'

const row = (data: Record<string, unknown>, createdBy = 'u1') => ({ data, createdBy })

describe('objection schemas', () => {
  it('pass the SDK schema lint', () => {
    expect(lintSchemas(schemas)).toEqual([])
  })

  it('never let a client create or edit quotes, even as admin', () => {
    for (const role of ['viewer', 'member', 'admin']) {
      expect(canCreate(quotesSchema, role)).toBe(false)
      expect(canUpdate(quotesSchema, role, row({ status: 'kept' }), 'u1')).toBe(false)
    }
  })

  it('never let a client create claims or usage rows', () => {
    for (const role of ['member', 'admin']) {
      expect(canCreate(claimsSchema, role)).toBe(false)
      expect(canCreate(usageSchema, role)).toBe(false)
    }
  })

  it('let members reword and approve a claim, but not move its span', () => {
    const existing = { span: 'Auth, data, permissions', text: 'old', status: 'draft' }
    expect(checkFieldPermissions(claimsSchema, 'member', { text: 'new', status: 'approved' }, existing)).toBeNull()
    expect(checkFieldPermissions(claimsSchema, 'member', { span: 'something else' }, existing)).not.toBeNull()
  })

  it('let members create a version, but not set its status', () => {
    expect(canCreate(versionsSchema, 'member')).toBe(true)
    expect(checkFieldPermissions(versionsSchema, 'member', { caseId: 'c', number: 2, message: 'm' })).toBeNull()
    expect(checkFieldPermissions(versionsSchema, 'member', { caseId: 'c', message: 'm', status: 'done' })).not.toBeNull()
    expect(canUpdate(versionsSchema, 'member', row({ status: 'running' }), 'u1')).toBe(false)
  })

  it('keep votes one per user per quote, and only the voter can change theirs', () => {
    expect(votesSchema.uniqueOn).toEqual(['quoteId', 'userId'])
    expect(votesSchema.columns.find((c) => c.name === 'userId')?.userBound).toBe(true)
    expect(canUpdate(votesSchema, 'member', row({ userId: 'u1' }), 'u1')).toBe(true)
    expect(canUpdate(votesSchema, 'member', row({ userId: 'u2' }, 'u2'), 'u1')).toBe(false)
  })
})

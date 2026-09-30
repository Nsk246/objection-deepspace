import { describe, expect, it } from 'vitest'
import { tally, tallyLine, verdictOf } from './evidence'

describe('tally and verdict', () => {
  it('counts kept quotes by stance and removed quotes separately', () => {
    const t = tally([
      { stance: 'push', status: 'kept' },
      { stance: 'push', status: 'kept' },
      { stance: 'support', status: 'kept' },
      { stance: 'support', status: 'removed' },
    ])
    expect(t).toEqual({ push: 2, support: 1, removed: 1 })
    expect(tallyLine(t)).toBe('2 push back, 1 support, 1 removed')
    expect(verdictOf(t)).toBe('pushback')
  })

  it('does not let removed quotes decide the verdict', () => {
    expect(verdictOf({ push: 0, support: 0, removed: 5 })).toBe('none')
  })

  it('calls a close split mixed', () => {
    expect(verdictOf({ push: 3, support: 3, removed: 0 })).toBe('mixed')
  })
})

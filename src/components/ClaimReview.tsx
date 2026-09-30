/**
 * The human checkpoint. Before anything paid runs, the team rewords, approves
 * or drops each claim the AI split out. Only approved claims go on trial.
 */

import { useState } from 'react'
import { useMutations, type RecordData } from 'deepspace'
import { Button, Input, Label, Textarea, useToast } from '@/components/ui'
import { callAction } from '../lib/api'
import { cn } from '../lib/utils'
import type { ClaimData } from '../types'

export function ClaimReview({ versionId, claims, trialsLeft }: { versionId: string; claims: RecordData<ClaimData>[]; trialsLeft: number }) {
  const { error, success } = useToast()
  const [starting, setStarting] = useState(false)
  const approved = claims.filter((c) => c.data.status === 'approved').length

  async function runTrial() {
    setStarting(true)
    try {
      await callAction('startTrial', { versionId })
      success('Trial started', 'Results appear here as they are verified.')
    } catch (err) {
      error('Could not start the trial', (err as Error).message)
    } finally {
      setStarting(false)
    }
  }

  return (
    <section aria-label="Review claims" className="overflow-hidden panel">
      <div className="panel-header flex flex-wrap items-center justify-between gap-3 px-[22px] py-4">
        <div>
          <h2 className="m-0 text-base font-semibold">Review claims before the trial</h2>
          <p className="m-0 text-sm text-muted-foreground">
            Reword anything that is not quite what the message says. Only approved claims are searched.
          </p>
        </div>
        <Button loading={starting} disabled={approved === 0 || trialsLeft <= 0} onClick={runTrial}>
          Run trial
        </Button>
      </div>
      {trialsLeft <= 0 && (
        <p className="m-0 border-t border-rule px-[22px] py-3 text-sm text-muted-foreground">
          You have used today's trials. Your teammates can still run this one, or try again tomorrow.
        </p>
      )}
      <ol className="m-0 list-none p-0">
        {claims.map((c) => (
          <ClaimEditor key={c.recordId} claim={c} />
        ))}
      </ol>
    </section>
  )
}

function ClaimEditor({ claim }: { claim: RecordData<ClaimData> }) {
  const { ready, put } = useMutations<ClaimData>('claims')
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(claim.data.text)
  const [query, setQuery] = useState(claim.data.searchQuery)
  const c = claim.data
  const dropped = c.status === 'dropped'

  function save() {
    const trimmed = text.trim()
    if (!trimmed) return
    put(claim.recordId, {
      text: trimmed,
      searchQuery: query.trim() || trimmed,
    })
    setEditing(false)
  }

  return (
    <li className={cn('border-t border-rule px-[22px] py-4', dropped && 'bg-background')}>
      <div className="flex items-start gap-4">
        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-border text-[13px] font-bold text-ink-soft">
          {c.index}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 md:flex-1">
            {editing ? (
              <div className="flex flex-col gap-3">
                <div>
                  <Label htmlFor={`claim-${claim.recordId}`}>Claim</Label>
                  <Textarea id={`claim-${claim.recordId}`} value={text} maxLength={240} onChange={(e) => setText(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor={`query-${claim.recordId}`}>Search words</Label>
                  <Input id={`query-${claim.recordId}`} value={query} maxLength={120} onChange={(e) => setQuery(e.target.value)} />
                  <p className="mt-1 text-[13px] text-muted-foreground">The words developers would use when they talk about this.</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={!ready || !text.trim()} onClick={save}>
                    Save claim
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className={cn('m-0 font-semibold', dropped && 'text-muted-foreground line-through')}>{c.text}</p>
                <dl className="m-0 mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                  <dt>From</dt>
                  <dd className="m-0">“{c.span}”</dd>
                  <dt>Search words</dt>
                  <dd className="m-0">{c.searchQuery}</dd>
                </dl>
              </>
            )}
          </div>
          {!editing && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={!ready} onClick={() => setEditing(true)}>
                Reword this claim
              </Button>
              <Button
                size="sm"
                variant={c.status === 'approved' ? 'default' : 'outline'}
                aria-pressed={c.status === 'approved'}
                disabled={!ready}
                onClick={() =>
                  put(claim.recordId, {
                    status: c.status === 'approved' ? 'draft' : 'approved',
                  })
                }
              >
                {c.status === 'approved' ? 'Approved' : 'Approve'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-pressed={dropped}
                disabled={!ready}
                onClick={() => put(claim.recordId, { status: dropped ? 'draft' : 'dropped' })}
              >
                {dropped ? 'Restore' : 'Drop'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

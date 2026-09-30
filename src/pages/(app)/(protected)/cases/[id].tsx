/**
 * /cases/:id — the evidence board for one case.
 *
 * What shows depends on the selected version's status:
 *   draft / splitting   the message, waiting for claims
 *   claims_ready        the human checkpoint (ClaimReview)
 *   running / done      marked message, claim rows, evidence (fills live)
 * Everything here is live records, so teammates see the same board.
 */

import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutations, useQuery, type RecordData } from 'deepspace'
import { Button, Modal, Textarea, useToast } from '@/components/ui'
import { ClaimReview } from '../../../../components/ClaimReview'
import { ClaimRows } from '../../../../components/ClaimRows'
import { CompareVersions } from '../../../../components/CompareVersions'
import { EvidenceList } from '../../../../components/EvidenceList'
import { MarkedMessage } from '../../../../components/MarkedMessage'
import { PresenceAvatars } from '../../../../components/PresenceAvatars'
import { TrialStatus } from '../../../../components/TrialStatus'
import { config } from '../../../../config'
import { callAction } from '../../../../lib/api'
import { tally, verdictOf } from '../../../../lib/evidence'
import { useTrialsLeft } from '../../../../lib/hooks'
import { cn } from '../../../../lib/utils'
import type { CaseData, ClaimData, QuoteData, VersionData, VoteData } from '../../../../types'

export default function CasePage() {
  const { id: caseId = '' } = useParams()
  const { records: cases, status: caseStatus } = useQuery<CaseData>('cases')
  const { records: allVersions } = useQuery<VersionData>('versions', { where: { caseId } })
  const { records: allClaims } = useQuery<ClaimData>('claims', { where: { caseId } })
  const { records: allQuotes } = useQuery<QuoteData>('quotes', { where: { caseId } })
  const { records: votes } = useQuery<VoteData>('votes')
  const { trialsLeft } = useTrialsLeft()

  const caseRow = cases.find((c) => c.recordId === caseId)
  const versions = useMemo(() => [...allVersions].sort((a, b) => a.data.number - b.data.number), [allVersions])
  const [versionId, setVersionId] = useState<string | null>(null)
  const [comparing, setComparing] = useState(false)
  const [newVersionOpen, setNewVersionOpen] = useState(false)

  // Follow the newest version unless the user picked one.
  const version = versions.find((v) => v.recordId === versionId) ?? versions[versions.length - 1]

  if (caseStatus === 'loading') return <BoardSkeleton />
  if (!caseRow) {
    return <p className="px-8 py-10 text-muted-foreground">This case does not exist, or it was deleted.</p>
  }

  const doneVersions = versions.filter((v) => v.data.status === 'done')

  return (
    <div className="min-h-full">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-4 py-[18px] md:px-8">
        <div className="min-w-0">
          <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em]">{caseRow.data.title}</h1>
          <p className="m-0 mt-0.5 text-sm text-muted-foreground">Tested against {caseRow.data.audience}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3.5">
          <PresenceAvatars caseId={caseId} />
          {versions.length > 1 && (
            <div role="group" aria-label="Version" className="flex flex-wrap rounded-[10px] bg-subtle p-[3px]">
              {versions.map((v) => {
                const active = !comparing && v.recordId === version?.recordId
                return (
                  <button
                    key={v.recordId}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setComparing(false)
                      setVersionId(v.recordId)
                    }}
                    className={cn(
                      'min-h-[38px] cursor-pointer rounded-lg px-3.5',
                      active ? 'bg-card font-semibold shadow-[0_1px_2px_rgba(14,23,38,0.12)]' : 'font-medium text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Version {v.data.number}
                  </button>
                )
              })}
              {doneVersions.length > 1 && (
                <button
                  type="button"
                  aria-pressed={comparing}
                  onClick={() => setComparing(true)}
                  className={cn(
                    'min-h-[38px] cursor-pointer rounded-lg px-3.5',
                    comparing ? 'bg-card font-semibold shadow-[0_1px_2px_rgba(14,23,38,0.12)]' : 'font-medium text-muted-foreground hover:text-foreground',
                  )}
                >
                  Compare
                </button>
              )}
            </div>
          )}
          <Button size="lg" className="rounded-[10px] px-[18px]" disabled={!version} onClick={() => setNewVersionOpen(true)}>
            New version
          </Button>
        </div>
      </header>

      <main className="px-4 py-7 md:px-8">
        {comparing ? (
          <CompareVersions versions={doneVersions} claims={allClaims} quotes={allQuotes} />
        ) : version ? (
          <VersionBoard
            key={version.recordId}
            versionId={version.recordId}
            version={version.data}
            claims={allClaims.filter((c) => c.data.versionId === version.recordId)}
            quotes={allQuotes.filter((q) => q.data.versionId === version.recordId)}
            votes={votes}
            trialsLeft={trialsLeft}
          />
        ) : (
          <p className="text-muted-foreground">This case has no message yet. Use New version to add one.</p>
        )}
      </main>

      {version && newVersionOpen && (
        <NewVersionDialog
          caseId={caseId}
          nextNumber={(versions[versions.length - 1]?.data.number ?? 0) + 1}
          initialMessage={version.data.message}
          onClose={() => setNewVersionOpen(false)}
          onCreated={(id) => {
            setComparing(false)
            setVersionId(id)
          }}
        />
      )}
    </div>
  )
}

function VersionBoard({
  versionId,
  version,
  claims,
  quotes,
  votes,
  trialsLeft,
}: {
  versionId: string
  version: VersionData
  claims: RecordData<ClaimData>[]
  quotes: RecordData<QuoteData>[]
  votes: RecordData<VoteData>[]
  trialsLeft: number
}) {
  const { error: toastError } = useToast()
  const [splitting, setSplitting] = useState(false)
  const sorted = [...claims].sort((a, b) => a.data.index - b.data.index)
  const onTrial = sorted.filter((c) => c.data.status === 'approved')
  const reviewing = version.status === 'claims_ready' || (version.status === 'failed' && quotes.length === 0)

  const rows = onTrial.map((c) => ({
    id: c.recordId,
    index: c.data.index,
    text: c.data.text,
    tally: tally(quotes.filter((q) => q.data.claimId === c.recordId).map((q) => q.data)),
  }))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Until someone picks a claim, show the first one.
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0]

  const marked = (reviewing ? sorted.filter((c) => c.data.status !== 'dropped') : onTrial).map((c) => {
    const row = rows.find((r) => r.id === c.recordId)
    return { id: c.recordId, index: c.data.index, span: c.data.span, verdict: row && !reviewing ? verdictOf(row.tally) : ('none' as const) }
  })

  const total = tally(quotes.map((q) => q.data))

  async function split() {
    setSplitting(true)
    try {
      await callAction('splitClaims', { versionId })
    } catch (err) {
      toastError('Could not split the message', (err as Error).message)
    } finally {
      setSplitting(false)
    }
  }

  const messagePanel = (
    <article className="rounded-2xl border border-border bg-card p-[clamp(24px,3.4vw,48px)]">
      <MarkedMessage message={version.message} claims={marked} selectedId={reviewing ? null : selected?.id} onSelect={setSelectedId} />
    </article>
  )

  if (version.status === 'draft' || version.status === 'splitting') {
    return (
      <div className="flex max-w-3xl flex-col gap-5">
        {messagePanel}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-[22px] py-4">
          {version.status === 'splitting' ? (
            <span role="status" className="text-muted-foreground">
              Claude is splitting the message into checkable claims. This takes a few seconds.
            </span>
          ) : (
            <>
              <span className="flex-1 text-muted-foreground">{version.error || 'This version has not been split into claims yet.'}</span>
              <Button loading={splitting} onClick={split}>
                Split into claims
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (reviewing) {
    return (
      <div className="flex max-w-4xl flex-col gap-5">
        {messagePanel}
        {version.status === 'failed' && <p className="m-0 text-destructive">{version.error}</p>}
        <ClaimReview versionId={versionId} claims={sorted} trialsLeft={trialsLeft} />
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      <section aria-label="Message under test" className="flex min-w-0 flex-[1_1_560px] flex-col gap-5">
        {messagePanel}
        <ClaimRows
          claims={rows}
          selectedId={selected?.id ?? null}
          onSelect={setSelectedId}
          status={<TrialStatus version={version} kept={total.push + total.support} removed={total.removed} />}
        />
      </section>
      {selected && (
        <EvidenceList
          key={selected.id}
          claim={{ index: selected.index, text: selected.text }}
          quotes={quotes.filter((q) => q.data.claimId === selected.id)}
          votes={votes}
        />
      )}
    </div>
  )
}

function NewVersionDialog({
  caseId,
  nextNumber,
  initialMessage,
  onClose,
  onCreated,
}: {
  caseId: string
  nextNumber: number
  initialMessage: string
  onClose: () => void
  onCreated: (versionId: string) => void
}) {
  const { error } = useToast()
  const versions = useMutations<Pick<VersionData, 'caseId' | 'number' | 'message'>>('versions')
  const [message, setMessage] = useState(initialMessage)
  const [saving, setSaving] = useState(false)
  const unchanged = message.trim() === initialMessage.trim()

  async function create() {
    setSaving(true)
    try {
      const id = await versions.createConfirmed({ caseId, number: nextNumber, message: message.trim() })
      onCreated(id)
      onClose()
      await callAction('splitClaims', { versionId: id })
    } catch (err) {
      error('Could not create the version', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose}>
      <Modal.Header>
        <Modal.Title>Version {nextNumber}</Modal.Title>
        <Modal.Description>Rewrite the message. It is split into claims again, so you can compare the two trials.</Modal.Description>
      </Modal.Header>
      <Modal.Body>
        <Textarea aria-label="Message" rows={5} value={message} maxLength={config.limits.messageMaxChars} onChange={(e) => setMessage(e.target.value)} />
        {unchanged && <p className="mt-1 text-[13px] text-muted-foreground">Change the wording to create a new version.</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={saving} disabled={!versions.ready || unchanged || !message.trim()} onClick={create}>
          Create version {nextNumber}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-4 py-7 md:px-8" aria-busy="true">
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
      <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      <div className="h-40 animate-pulse rounded-2xl bg-muted" />
    </div>
  )
}

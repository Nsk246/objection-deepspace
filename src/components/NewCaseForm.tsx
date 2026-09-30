/**
 * Create a case: the message under test and who it is for. Creating the case
 * also creates version 1 and asks the server to split it into claims.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutations } from 'deepspace'
import { Button, Input, Label, Textarea, useToast } from '@/components/ui'
import { config } from '../config'
import { callAction } from '../lib/api'
import type { CaseData, VersionData } from '../types'

type NewVersion = Pick<VersionData, 'caseId' | 'number' | 'message'>

export function NewCaseForm() {
  const navigate = useNavigate()
  const { error } = useToast()
  const cases = useMutations<CaseData>('cases')
  const versions = useMutations<NewVersion>('versions')
  const [title, setTitle] = useState('')
  const [audience, setAudience] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const problems = {
    title: title.trim() ? null : 'Give the case a name, like "Homepage hero".',
    audience: audience.trim() ? null : 'Say who the message is for.',
    message: message.trim() ? null : 'Paste the message you want to test.',
  }
  const valid = !problems.title && !problems.audience && !problems.message

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!valid) return
    setSaving(true)
    try {
      // Confirmed writes: the split call below needs both rows to exist.
      const caseId = await cases.createConfirmed({ title: title.trim(), audience: audience.trim() })
      const versionId = await versions.createConfirmed({ caseId, number: 1, message: message.trim() })
      navigate(`/cases/${caseId}`)
      await callAction('splitClaims', { versionId })
    } catch (err) {
      error('Could not set up the case', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const fieldError = (msg: string | null) => (submitted && msg ? <p className="mt-1 text-[13px] text-destructive">{msg}</p> : null)

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="m-0 text-lg font-semibold tracking-[-0.015em]">Put a message on trial</h2>
      <div>
        <Label htmlFor="case-title">Case name</Label>
        <Input id="case-title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} aria-invalid={submitted && !!problems.title} />
        {fieldError(problems.title)}
      </div>
      <div>
        <Label htmlFor="case-audience">Who it is for</Label>
        <Input
          id="case-audience"
          value={audience}
          maxLength={config.limits.audienceMaxChars}
          placeholder="Solo developers shipping with coding agents"
          onChange={(e) => setAudience(e.target.value)}
          aria-invalid={submitted && !!problems.audience}
        />
        {fieldError(problems.audience)}
      </div>
      <div>
        <Label htmlFor="case-message">Message</Label>
        <Textarea
          id="case-message"
          value={message}
          rows={4}
          maxLength={config.limits.messageMaxChars}
          placeholder="Paste a headline, a pitch or a launch post intro."
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={submitted && !!problems.message}
        />
        <p className="mt-1 text-[13px] text-muted-foreground">
          {message.length} of {config.limits.messageMaxChars} characters. Claude splits it into claims next; nothing is searched until your team approves them.
        </p>
        {fieldError(problems.message)}
      </div>
      <div>
        <Button type="submit" loading={saving} disabled={!cases.ready || !versions.ready}>
          Split into claims
        </Button>
      </div>
    </form>
  )
}

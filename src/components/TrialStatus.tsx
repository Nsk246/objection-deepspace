/**
 * One status line for a version: live job progress while running (from the
 * JobRoom over WebSocket), then the finished summary.
 */

import { useJobs } from 'deepspace'
import { SCOPE_ID } from '../constants'
import { cn } from '../lib/utils'
import type { VersionData } from '../types'

export function TrialStatus({ version, kept, removed }: { version: VersionData; kept: number; removed: number }) {
  const { getJob } = useJobs(SCOPE_ID)
  const job = version.jobId ? getJob(version.jobId) : undefined

  if (version.status === 'running') {
    const pct = Math.round((job?.progress ?? 0) * 100)
    return (
      <span className="flex flex-wrap items-center gap-2" role="status" aria-live="polite">
        <span className="h-2 w-2 animate-pulse rounded-full bg-push motion-reduce:animate-none" aria-hidden />
        {job?.progressMessage ?? 'Starting the trial'}
        <span className="tabular-nums">{pct}%</span>
        <span>
          {kept} kept, {removed} removed so far
        </span>
      </span>
    )
  }

  if (version.status === 'failed') {
    return <Dot className="bg-destructive">{version.error || 'The trial stopped. Run it again.'}</Dot>
  }

  if (version.status === 'done') {
    const at = version.finishedAt ? new Date(version.finishedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''
    return (
      <Dot className="bg-verified">
        Trial finished{at ? ` at ${at}` : ''}. {kept} quotes kept, {removed} removed{version.pagesRead ? ` from ${version.pagesRead} pages` : ''}.
      </Dot>
    )
  }

  return null
}

function Dot({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2" role="status">
      <span className={cn('h-2 w-2 rounded-full', className)} aria-hidden />
      {children}
    </span>
  )
}

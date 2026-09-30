/**
 * /cases — the team's cases, newest first, next to the form for a new one.
 */

import { Link } from 'react-router-dom'
import { useQuery } from 'deepspace'
import { NewCaseForm } from '../../../../components/NewCaseForm'
import type { CaseData, VersionData } from '../../../../types'

const STATUS_TEXT: Record<VersionData['status'], string> = {
  draft: 'Not split yet',
  splitting: 'Splitting into claims',
  claims_ready: 'Claims waiting for review',
  running: 'Trial running',
  done: 'Trial finished',
  failed: 'Trial stopped',
}

export default function CasesPage() {
  const { records: cases, status, error } = useQuery<CaseData>('cases', { orderBy: 'createdAt', orderDir: 'desc' })
  const { records: versions } = useQuery<VersionData>('versions')

  const latestVersion = (caseId: string) =>
    versions.filter((v) => v.data.caseId === caseId).sort((a, b) => b.data.number - a.data.number)[0]

  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-6 px-4 py-7 md:px-8">
      <section className="min-w-0 flex-[1_1_420px]">
        <h1 className="m-0 mb-1 text-[22px] font-bold tracking-[-0.02em]">Cases</h1>
        <p className="m-0 mb-5 text-muted-foreground">Every message your team has put on trial. Everyone on the team sees the same cases, live.</p>

        {status === 'loading' && (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}
        {status === 'error' && <p className="text-destructive">Cases could not load: {error}. Reload the page to try again.</p>}
        {status === 'ready' && cases.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-muted-foreground">
            No cases yet. Paste a message in the form to put it on trial.
          </p>
        )}
        {status === 'ready' && cases.length > 0 && (
          <ul className="m-0 list-none overflow-hidden rounded-2xl border border-border bg-card p-0">
            {cases.map((c) => {
              const v = latestVersion(c.recordId)
              return (
                <li key={c.recordId} className="border-t border-rule first:border-t-0">
                  <Link to={`/cases/${c.recordId}`} className="flex flex-wrap items-center justify-between gap-2 px-[22px] py-4 text-foreground no-underline hover:bg-background">
                    <span className="min-w-0">
                      <span className="block font-semibold">{c.data.title}</span>
                      <span className="block text-sm text-muted-foreground">For {c.data.audience}</span>
                    </span>
                    {v && (
                      <span className="text-sm text-muted-foreground">
                        Version {v.data.number}. {STATUS_TEXT[v.data.status]}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      <div className="min-w-0 flex-[1_1_360px]">
        <NewCaseForm />
      </div>
    </div>
  )
}

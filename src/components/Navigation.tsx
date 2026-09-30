/**
 * App sidebar: logo, the team's cases, Evidence memory, today's trial
 * allowance, and the account menu. On narrow screens it folds into a top bar
 * with a menu button.
 *
 * Keeps the scaffold's test hooks: app-navigation, nav-sign-in-button,
 * nav-user-name, nav-user-email.
 */

import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthOverlay, signOut, useAuthProfileReady, useQuery } from 'deepspace'
import { Bookmark, LogOut, Menu, X } from 'lucide-react'
import { config } from '../config'
import { useTrialsLeft } from '../lib/hooks'
import { cn } from '../lib/utils'
import type { CaseData, VersionData } from '../types'
import { Logo } from './Logo'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui'

export default function Navigation() {
  const { isLoaded, isSignedIn, user, userLoading } = useAuthProfileReady({ requireUser: true })
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => setOpen(false), [location.pathname])

  const profileReady = !isSignedIn || (!userLoading && !!user)

  return (
    <>
      <nav
        data-testid="app-navigation"
        aria-label="Workspace"
        className="flex shrink-0 flex-col border-b border-border bg-card md:min-h-screen md:w-[236px] md:gap-[22px] md:border-r md:border-b-0 md:px-3.5 md:py-5"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 md:px-2 md:py-0">
          <Link to="/cases" className="flex items-center gap-2.5 text-foreground no-underline">
            <Logo />
            <span className="text-[17px] font-bold tracking-[-0.02em]">Objection</span>
          </Link>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>

        <div className={cn('flex-col gap-[22px] px-3 pb-4 md:flex md:flex-1 md:px-0 md:pb-0', open ? 'flex' : 'hidden')}>
          {isSignedIn && <CaseLinks pathname={location.pathname} />}

          {isSignedIn && (
            <Link
              to="/memory"
              aria-current={location.pathname.startsWith('/memory') ? 'page' : undefined}
              className={cn(
                'flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-ink-soft no-underline hover:bg-background',
                location.pathname.startsWith('/memory') && 'bg-subtle font-semibold text-foreground',
              )}
            >
              <Bookmark className="size-4" aria-hidden />
              Evidence memory
            </Link>
          )}

          <div className="mt-auto flex flex-col gap-3">
            {isSignedIn && <TrialsNote />}
            {!isLoaded ? null : isSignedIn && !profileReady ? (
              <div className="h-11 animate-pulse rounded-lg bg-muted" />
            ) : isSignedIn && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      aria-label="Account menu"
                      className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left text-sm hover:bg-background"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={user.imageUrl ?? undefined} referrerPolicy="no-referrer" />
                        <AvatarFallback className="text-[11px]">{(user.name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span data-testid="nav-user-name" className="min-w-0 truncate text-foreground">
                        {user.name || user.email}
                      </span>
                    </button>
                  }
                />
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>
                    <div className="truncate font-medium text-foreground">{user.name || 'Signed in'}</div>
                    <div data-testid="nav-user-email" className="truncate text-xs font-normal text-muted-foreground">
                      {user.email}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut aria-hidden />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                data-testid="nav-sign-in-button"
                onClick={() => setShowAuth(true)}
                className="min-h-11 rounded-[10px] bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuth && <AuthOverlay onClose={() => setShowAuth(false)} />}
    </>
  )
}

function CaseLinks({ pathname }: { pathname: string }) {
  const { records: cases, status } = useQuery<CaseData>('cases', { orderBy: 'createdAt', orderDir: 'desc', limit: 30 })
  const { records: versions } = useQuery<VersionData>('versions')
  const latest = new Map<string, number>()
  for (const v of versions) latest.set(v.data.caseId, Math.max(latest.get(v.data.caseId) ?? 0, v.data.number))

  return (
    <div className="flex flex-col gap-0.5">
      <p className="mx-2 mb-1.5 text-[13px] font-medium text-muted-foreground">
        <Link to="/cases" className="text-muted-foreground no-underline hover:text-foreground">
          Cases
        </Link>
      </p>
      {status === 'loading' && [0, 1, 2].map((i) => <div key={i} className="mx-2 my-1 h-8 animate-pulse rounded-md bg-muted" />)}
      {status === 'ready' && cases.length === 0 && <p className="mx-2 text-sm text-muted-foreground">No cases yet.</p>}
      {cases.map((c) => {
        const active = pathname === `/cases/${c.recordId}`
        return (
          <Link
            key={c.recordId}
            to={`/cases/${c.recordId}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-10 items-center justify-between gap-2 rounded-lg px-2.5 no-underline',
              active ? 'bg-subtle font-semibold text-foreground' : 'text-ink-soft hover:bg-background',
            )}
          >
            <span className="truncate">{c.data.title}</span>
            {latest.has(c.recordId) && <span className="text-xs font-medium text-muted-foreground">v{latest.get(c.recordId)}</span>}
          </Link>
        )
      })}
    </div>
  )
}

function TrialsNote() {
  const { trialsLeft, loading } = useTrialsLeft()
  if (loading) return null
  return (
    <p className="m-0 rounded-[10px] bg-background p-3 text-[13px] text-muted-foreground">
      {trialsLeft} of {config.limits.trialsPerUserPerDay} trials left today. Trials search the web and run AI, so each person has a daily limit.
    </p>
  )
}

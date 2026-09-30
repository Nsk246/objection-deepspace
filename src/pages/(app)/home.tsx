/* home pattern: split-hero — one-line pitch beside a sample marked message; signed-in users go straight to their cases */

/**
 * /home — the dynamic front door. OAuth returns here. Signed-in users land on
 * their team's cases; signed-out visitors see what the board does and sign in.
 */

import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthOverlay, useAuth } from 'deepspace'
import { Button } from '@/components/ui'
import { Steps, UseCases } from '../../components/landing/Explainer'
import { SampleMessage } from '../../components/landing/SampleMessage'

export default function HomePage() {
  const { isLoaded, isSignedIn } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  if (isLoaded && isSignedIn) return <Navigate to="/cases" replace />

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
      <div className="flex flex-wrap items-center gap-10">
        <div className="min-w-0 flex-[1_1_340px]">
          <p className="m-0 mb-3 text-sm font-semibold text-push-text">
            For teams building developer tools, APIs, SDKs and coding agents
          </p>
          <h1 className="m-0 text-[clamp(30px,4vw,44px)] font-bold leading-tight tracking-[-0.025em]">
            Test your dev tool's pitch against real developers
          </h1>
          <p className="mt-4 max-w-[48ch] text-lg text-foreground">
            Objection splits your launch copy into claims, finds what programmers said about each one on Hacker News, dev.to and GitHub, and
            checks every quote against the page it came from. Your team decides what counts.
          </p>
          <Button size="lg" className="mt-6 rounded-[10px]" onClick={() => setShowAuth(true)}>
            Sign in to start a case
          </Button>
        </div>
        <div className="min-w-0 flex-[1_1_420px]">
          <SampleMessage />
        </div>
      </div>
      <section aria-labelledby="home-how" className="mt-12">
        <h2 id="home-how" className="m-0 mb-4 text-xl font-bold tracking-[-0.02em]">
          How a trial works
        </h2>
        <Steps />
      </section>
      <section aria-labelledby="home-when" className="mt-10">
        <h2 id="home-when" className="m-0 mb-4 text-xl font-bold tracking-[-0.02em]">
          When to use it
        </h2>
        <UseCases />
      </section>
      {showAuth && <AuthOverlay onClose={() => setShowAuth(false)} />}
    </div>
  )
}

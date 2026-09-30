/* home pattern: split-hero — one-line pitch beside a sample marked message; signed-in users go straight to their cases */

/**
 * /home — the dynamic front door. OAuth returns here. Signed-in users land on
 * their team's cases; signed-out visitors see what the board does and sign in.
 */

import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthOverlay, useAuth } from 'deepspace'
import { Button } from '@/components/ui'
import { SampleMessage } from '../../components/landing/SampleMessage'

export default function HomePage() {
  const { isLoaded, isSignedIn } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  if (isLoaded && isSignedIn) return <Navigate to="/cases" replace />

  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-10 px-4 py-12 md:px-8">
      <div className="min-w-0 flex-[1_1_340px]">
        <h1 className="m-0 text-[clamp(30px,4vw,44px)] font-bold leading-tight tracking-[-0.025em]">Put your launch message on trial</h1>
        <p className="mt-4 max-w-[46ch] text-lg text-muted-foreground">
          Objection splits your message into claims, finds what developers actually said about each one, and checks every quote against the page it came from. Your team decides what counts.
        </p>
        <Button size="lg" className="mt-6 rounded-[10px]" onClick={() => setShowAuth(true)}>
          Sign in to start a case
        </Button>
      </div>
      <div className="min-w-0 flex-[1_1_420px]">
        <SampleMessage />
      </div>
      {showAuth && <AuthOverlay onClose={() => setShowAuth(false)} />}
    </div>
  )
}

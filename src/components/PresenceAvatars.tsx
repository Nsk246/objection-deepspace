/**
 * Who else has this case open right now. Presence is per case, in memory on
 * the PresenceRoom; identity comes from the verified JWT, not the client.
 */

import { usePresenceRoom, useUser } from 'deepspace'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase()
}

const avatar = 'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground ring-2 ring-card'

export function PresenceAvatars({ caseId }: { caseId: string }) {
  const { peers } = usePresenceRoom(`case:${caseId}`)
  const { user } = useUser()
  // One avatar per person, even with several tabs open.
  const others = [...new Map(peers.map((p) => [p.userId, p])).values()].filter((p) => p.userId !== user?.id)
  const names = [...others.map((p) => p.userName || 'A teammate'), 'you']
  const label = `Here now: ${names.join(', ')}`

  return (
    <div className="flex items-center -space-x-1.5" title={label}>
      <span className="sr-only">{label}</span>
      {others.slice(0, 4).map((p) => (
        <span key={p.userId} aria-hidden className={`${avatar} bg-support`}>
          {initials(p.userName || '?')}
        </span>
      ))}
      <span aria-hidden className={`${avatar} bg-primary`}>
        {initials(user?.name || user?.email || '?')}
      </span>
    </div>
  )
}

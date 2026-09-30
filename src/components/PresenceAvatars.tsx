/**
 * Who else has this case open right now. Presence is per case, in memory on
 * the PresenceRoom; identity comes from the verified JWT, not the client.
 */

import { usePresenceRoom, useUser } from 'deepspace'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function PresenceAvatars({ caseId }: { caseId: string }) {
  const { peers } = usePresenceRoom(`case:${caseId}`)
  const { user } = useUser()
  // One avatar per person, even with several tabs open.
  const others = [...new Map(peers.map((p) => [p.userId, p])).values()].filter((p) => p.userId !== user?.id)
  const names = [...others.map((p) => p.userName || 'A teammate'), 'you']

  return (
    <div className="flex items-center" title={`${names.join(', ')} ${names.length > 1 ? 'are' : 'is'} here`}>
      <span className="sr-only">{`Here now: ${names.join(', ')}`}</span>
      {others.slice(0, 4).map((p) => (
        <span
          key={p.userId}
          aria-hidden
          className="-mr-2 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-card bg-support text-xs font-semibold text-primary-foreground"
        >
          {initials(p.userName || '?')}
        </span>
      ))}
      <span
        aria-hidden
        className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-card bg-primary text-xs font-semibold text-primary-foreground"
      >
        {initials(user?.name || user?.email || '?')}
      </span>
    </div>
  )
}

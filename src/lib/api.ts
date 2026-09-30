/**
 * Client helper for the two server actions (src/actions/index.ts).
 * The worker verifies the bearer token; the browser never names a user.
 */

import { getAuthToken } from 'deepspace'

export type ActionName = 'splitClaims' | 'startTrial'

export async function callAction<T = unknown>(name: ActionName, params: Record<string, unknown>): Promise<T> {
  const token = await getAuthToken()
  if (!token) throw new Error('Sign in to do this.')
  const res = await fetch(`/api/actions/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
  })
  const body = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T; error?: string }
  if (!res.ok || !body.success) throw new Error(body.error ?? `Request failed (${res.status}).`)
  return body.data as T
}

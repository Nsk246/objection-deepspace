/**
 * Small data hooks shared by pages. Records are envelopes: fields are on `.data`.
 */

import { useQuery } from 'deepspace'
import { config } from '../config'
import { todayKey, type UsageData } from '../types'

/** Trials the signed-in user has left today. The usage row is readable only by its owner. */
export function useTrialsLeft(): { trialsLeft: number; loading: boolean } {
  const { records, status } = useQuery<UsageData>('usage', { where: { day: todayKey() } })
  const used = records[0]?.data.trials ?? 0
  return { trialsLeft: Math.max(0, config.limits.trialsPerUserPerDay - used), loading: status === 'loading' }
}

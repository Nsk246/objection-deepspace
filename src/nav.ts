/**
 * Navigation Config — kept for the scaffold's nav contract. The Objection
 * sidebar (components/Navigation.tsx) renders cases and Evidence memory
 * directly, because the case list is live data, not static config.
 */

import type { Role } from './constants'

export interface NavItem {
  path: string
  label: string
  roles?: Role[]
  devOnly?: boolean
}

export const nav: NavItem[] = [
  { path: '/cases', label: 'Cases' },
  { path: '/memory', label: 'Evidence memory' },
]

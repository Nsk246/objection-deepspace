/**
 * Colour roles for a claim, by verdict. Full class names are written out so
 * Tailwind can find them. Orange = push back, blue = support, grey = nothing.
 */

import type { Verdict } from '../lib/evidence'

export interface Tone {
  mark: string
  number: string
  badge: string
  row: string
  label: string
  outline: string
}

const push: Tone = {
  mark: 'bg-push-tint shadow-[inset_0_-3px_0_var(--color-push)] rounded px-1',
  number: 'text-push-text',
  badge: 'bg-push text-primary-foreground',
  row: 'bg-push-row',
  label: 'text-push-text',
  outline: 'outline-2 outline-offset-[3px] outline-push',
}

const support: Tone = {
  mark: 'bg-support-tint shadow-[inset_0_-3px_0_var(--color-support)] rounded px-1',
  number: 'text-support',
  badge: 'bg-support text-primary-foreground',
  row: 'bg-support-row',
  label: 'text-support',
  outline: 'outline-2 outline-offset-[3px] outline-support',
}

// Evidence both ways: highlighted, but in ink rather than either stance colour.
const mixed: Tone = {
  mark: 'bg-subtle shadow-[inset_0_-3px_0_var(--color-ink-soft)] rounded px-1',
  number: 'text-ink-soft',
  badge: 'bg-ink-soft text-primary-foreground',
  row: 'bg-subtle',
  label: 'text-ink-soft',
  outline: 'outline-2 outline-offset-[3px] outline-ink-soft',
}

const none: Tone = {
  mark: 'shadow-[inset_0_-2px_0_var(--color-quiet)] px-0.5',
  number: 'text-muted-foreground',
  badge: 'bg-border text-ink-soft',
  row: 'bg-subtle',
  label: 'text-muted-foreground',
  outline: 'outline-2 outline-offset-[3px] outline-quiet',
}

export function toneOf(verdict: Verdict): Tone {
  return { pushback: push, support, mixed, none }[verdict]
}

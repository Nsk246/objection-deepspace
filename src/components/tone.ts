/**
 * Colour roles for a claim, by verdict. Full class names are written out so
 * Tailwind can find them. Orange = push back, blue = support, grey = nothing.
 */

import type { Verdict } from '../lib/evidence'

export interface Tone {
  /** Highlighter stroke on the message. */
  mark: string
  /** Extra emphasis on the selected mark: a heavier stroke, no box. */
  selected: string
  number: string
  badge: string
  row: string
  label: string
}

const push: Tone = {
  mark: 'bg-push-tint px-1 shadow-[inset_0_-3px_0_var(--color-push)]',
  selected: 'shadow-[inset_0_-6px_0_var(--color-push)]',
  number: 'text-push-text',
  badge: 'bg-push text-primary-foreground',
  row: 'bg-push-row',
  label: 'text-push-text',
}

const support: Tone = {
  mark: 'bg-support-tint px-1 shadow-[inset_0_-3px_0_var(--color-support)]',
  selected: 'shadow-[inset_0_-6px_0_var(--color-support)]',
  number: 'text-support',
  badge: 'bg-support text-primary-foreground',
  row: 'bg-support-row',
  label: 'text-support',
}

// Evidence both ways: highlighted, but in ink rather than either stance colour.
const mixed: Tone = {
  mark: 'bg-subtle px-1 shadow-[inset_0_-3px_0_var(--color-ink-soft)]',
  selected: 'shadow-[inset_0_-6px_0_var(--color-ink-soft)]',
  number: 'text-ink-soft',
  badge: 'bg-ink-soft text-primary-foreground',
  row: 'bg-subtle',
  label: 'text-ink-soft',
}

const none: Tone = {
  mark: 'bg-transparent px-0.5 shadow-[inset_0_-2px_0_var(--color-quiet)]',
  selected: 'bg-subtle shadow-[inset_0_-4px_0_var(--color-quiet)]',
  number: 'text-muted-foreground',
  badge: 'bg-border text-ink-soft',
  row: 'bg-subtle',
  label: 'text-muted-foreground',
}

export function toneOf(verdict: Verdict): Tone {
  return { pushback: push, support, mixed, none }[verdict]
}

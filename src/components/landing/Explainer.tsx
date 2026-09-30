/**
 * Shared explainer blocks for the landing and the signed-out home: when to
 * use Objection, how a trial works, and a worked example of the output.
 * Static markup only (no hooks), so it prerenders.
 */

import { cn } from '../../lib/utils'

export const STEPS = [
  {
    title: 'Paste your message',
    body: 'A headline, pitch or launch post intro, plus who it is for.',
  },
  {
    title: 'Approve the claims',
    body: 'Claude splits it into 3 to 5 checkable claims, each tied to the exact words it came from. Your team rewords or drops them before anything is searched.',
  },
  {
    title: 'Run the trial',
    body: 'A background job searches recent Hacker News, dev.to and GitHub discussion for each claim and pulls out sentences that push back or agree.',
  },
  {
    title: 'Keep only what is real',
    body: 'Code keeps a quote only if it appears word for word on the linked page. Anything else is shown as removed, with the reason.',
  },
  {
    title: 'Decide together, then rewrite',
    body: 'Your team votes each quote relevant or off-topic, live. Write version 2 and compare the pushback side by side.',
  },
]

export function Steps({ className }: { className?: string }) {
  return (
    <ol className={cn('panel m-0 grid list-none overflow-hidden p-0 sm:grid-cols-2 lg:grid-cols-5', className)}>
      {STEPS.map((s, i) => (
        <li
          key={s.title}
          className="flex flex-col gap-2 border-border p-5 max-sm:[&:not(:first-child)]:border-t sm:max-lg:[&:nth-child(n+3)]:border-t sm:max-lg:[&:nth-child(even)]:border-l lg:[&:not(:first-child)]:border-l"
        >
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {i + 1}
          </span>
          <h3 className="m-0 text-base font-semibold">{s.title}</h3>
          <p className="m-0 text-base text-muted-foreground">{s.body}</p>
        </li>
      ))}
    </ol>
  )
}

export const USE_CASES = [
  { title: 'Before a launch', body: 'Test the homepage hero or Show HN title while you can still change it.' },
  { title: 'Rewriting positioning', body: 'See which claim draws the most pushback, rewrite it, and compare versions.' },
  { title: 'Before customer calls', body: 'Walk in knowing the objections developers already raise, with links to who said them.' },
  { title: 'Keeping claims honest', body: 'Catch technical claims developers dispute before they reach a landing page.' },
]

export function UseCases() {
  return (
    <ul className="panel m-0 grid list-none overflow-hidden p-0 sm:grid-cols-2">
      {USE_CASES.map((u) => (
        <li
          key={u.title}
          className="border-border p-5 max-sm:[&:not(:first-child)]:border-t sm:[&:nth-child(n+3)]:border-t sm:[&:nth-child(even)]:border-l"
        >
          <h3 className="m-0 text-base font-semibold">{u.title}</h3>
          <p className="m-0 mt-1 text-base text-muted-foreground">{u.body}</p>
        </li>
      ))}
    </ul>
  )
}

/**
 * What a finished trial gives you, drawn with the real board styles.
 * The removed quote is deliberately invented: it shows what the verifier throws out.
 */
export function ExampleResult() {
  return (
    <figure className="panel m-0 overflow-hidden">
      <div className="panel-header flex flex-wrap items-baseline justify-between gap-2 px-5 py-3.5">
        <span className="text-sm font-semibold">Claim 1: Your coding agent can ship a production app today</span>
        <span className="text-sm font-semibold text-push-text">Mostly pushback</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule px-5 py-3.5">
        <span className="text-sm text-muted-foreground">5 push back, 2 support, 3 removed</span>
        <span aria-hidden className="flex h-1.5 w-40 overflow-hidden rounded-[3px] bg-rule">
          <span className="w-[62%] bg-push" />
          <span className="w-[25%] bg-support" />
        </span>
      </div>
      <dl className="m-0 grid gap-0 text-sm">
        <div className="border-b border-rule px-5 py-3.5">
          <dt className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-push-tint px-2 py-0.5 font-semibold text-push-badge">Push back</span>
            <span className="text-verified">Verified</span>
          </dt>
          <dd className="m-0 text-muted-foreground">
            A real sentence from a developer, found word for word on the linked thread, with the team's relevant or off-topic votes.
          </dd>
        </div>
        <div className="bg-background px-5 py-3.5">
          <dt className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-border px-2 py-0.5 font-semibold text-ink-soft">Removed</span>
            <span className="text-muted-foreground">Not on the source page</span>
          </dt>
          <dd className="m-0 text-muted-foreground line-through">Coding agents cannot handle authentication at all.</dd>
        </div>
      </dl>
      <figcaption className="border-t border-rule px-5 py-3 text-sm text-muted-foreground">
        Illustration of the output. The removed line was invented by the AI, so the verifier threw it out.
      </figcaption>
    </figure>
  )
}

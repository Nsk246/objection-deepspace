/**
 * Design direction: "Studio". A bright, plain product page for people who
 * write launch copy for developers. The hero shows the product's own signature
 * element, a message with claims marked like highlighter strokes. Each section
 * is a bordered panel on a grey canvas, so the page reads as separate, clear
 * blocks. Colour appears only where it carries meaning: orange for pushback,
 * blue for support. Copy is short and literal; no marketing adjectives.
 *
 * Landing page — a STATIC page (no DeepSpace providers, prerendered at build).
 */

import { Link } from 'react-router-dom'
import { ExampleResult, Steps, UseCases } from '../components/landing/Explainer'
import { SampleMessage } from '../components/landing/SampleMessage'
import { Logo } from '../components/Logo'
import { Seo } from '../components/Seo'
import { seo } from '../seo'

const cta =
  'inline-flex min-h-11 items-center rounded-[10px] bg-primary px-[18px] font-semibold text-primary-foreground no-underline hover:bg-primary/90'

function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-border py-14">
      <h2 id={id} className="m-0 text-2xl font-bold tracking-[-0.02em]">
        {title}
      </h2>
      {lead && <p className="m-0 mt-2 max-w-[68ch] text-muted-foreground">{lead}</p>}
      <div className="mt-7">{children}</div>
    </section>
  )
}

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div data-testid="static-landing" className="min-h-screen">
        <header className="border-b border-border bg-card shadow-[0_1px_3px_rgba(14,23,38,0.06)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
            <span className="flex items-center gap-2.5">
              <Logo />
              <span className="text-[17px] font-bold tracking-[-0.02em]">Objection</span>
            </span>
            <Link to="/home" className={cta}>
              Open Objection
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
          <section className="flex flex-wrap items-center gap-10 py-12 md:py-16">
            <div className="min-w-0 flex-[1_1_340px]">
              <p className="m-0 mb-3 text-sm font-semibold text-push-text">For teams writing launch copy for developers</p>
              <h1 className="m-0 text-[clamp(34px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.03em]">
                Put your launch message on trial
              </h1>
              <p className="mt-5 max-w-[46ch] text-lg text-muted-foreground">
                Paste a headline or pitch. Objection checks each claim in it against what developers have actually said online, and shows
                you where they push back, with real quotes and links.
              </p>
              <p className="mt-3 max-w-[46ch] text-muted-foreground">
                Every quote is checked word for word against its source page. Nothing is made up, and your team decides what matters.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link to="/home" className={cta}>
                  Start a case
                </Link>
                <a href="#how" className="font-medium text-foreground underline-offset-4 hover:underline">
                  See how it works
                </a>
              </div>
            </div>
            <div className="min-w-0 flex-[1_1_440px]">
              <SampleMessage />
            </div>
          </section>

          <Section
            id="problem"
            title="The problem it solves"
            lead="Launch copy is full of claims: this is fast, this is easy, developers want this. You usually find out which ones developers reject after you publish, in the comments."
          >
            <div className="panel grid overflow-hidden md:grid-cols-2">
              <div className="p-6">
                <h3 className="m-0 text-base font-semibold">Without Objection</h3>
                <ul className="m-0 mt-3 flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
                  <li>The team argues from opinion about which claims will land.</li>
                  <li>AI tools write fluent "user feedback" that nobody actually said.</li>
                  <li>The first real pushback arrives on launch day.</li>
                </ul>
              </div>
              <div className="border-border p-6 max-md:border-t md:border-l">
                <h3 className="m-0 text-base font-semibold">With Objection</h3>
                <ul className="m-0 mt-3 flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
                  <li>Each claim is tested separately against recent developer discussion.</li>
                  <li>Only quotes found word for word on the source page count as evidence.</li>
                  <li>You rewrite the weak claim before launch and compare versions.</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section
            id="how"
            title="How a trial works"
            lead="Five steps. The AI does two small jobs, code checks its work, and people make the calls."
          >
            <Steps />
          </Section>

          <Section
            id="output"
            title="What you get for each claim"
            lead="A verdict, the counts behind it, and every quote with its source. Removed quotes stay visible, so nothing is hidden."
          >
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <ExampleResult />
              <ul className="panel m-0 flex list-none flex-col p-0">
                {[
                  ['Verdict per claim', 'Mostly pushback, mostly support, mixed, or no discussion found.'],
                  [
                    'Verified quotes with links',
                    'Each one opens the thread it came from, so you can read the context or contact the person.',
                  ],
                  ['Removed quotes with reasons', 'Shown struck through, so the team can see what the AI got wrong.'],
                  ['Team votes, live', 'Everyone on the case sees the same board and marks quotes relevant or off-topic.'],
                  ['Version compare', 'Rewrite the message and see whether the pushback drops.'],
                  ['Evidence memory', "Past quotes and votes are reused when a claim comes up again, so the team's judgment builds up."],
                ].map(([t, b]) => (
                  <li key={t} className="border-t border-rule px-5 py-3.5 first:border-t-0">
                    <span className="block font-semibold">{t}</span>
                    <span className="block text-sm text-muted-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <Section id="when" title="When to use it">
            <UseCases />
          </Section>

          <Section id="trust" title="Why you can trust the results" lead="The AI never has the final word.">
            <div className="panel grid overflow-hidden md:grid-cols-3">
              {[
                [
                  'No personas, no invented opinions',
                  'The AI only splits claims and picks sentences. It never writes feedback or pretends to be a developer.',
                ],
                [
                  'Checked in code',
                  'A quote survives only if it appears word for word on the page that was fetched. Clients cannot create or edit quotes.',
                ],
                [
                  'People decide',
                  'Your team approves claims before anything is searched and votes on every quote. Fewer quotes you can trust beat many you cannot.',
                ],
              ].map(([t, b], i) => (
                <div key={t} className={i ? 'border-border p-6 max-md:border-t md:border-l' : 'p-6'}>
                  <h3 className="m-0 text-base font-semibold">{t}</h3>
                  <p className="m-0 mt-2 text-sm text-muted-foreground">{b}</p>
                </div>
              ))}
            </div>
          </Section>

          <section className="panel mt-2 flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h2 className="m-0 text-xl font-bold tracking-[-0.02em]">Test your next headline before developers do</h2>
              <p className="m-0 mt-1 text-muted-foreground">Sign in with GitHub or Google. Each person gets 5 trials a day.</p>
            </div>
            <Link to="/home" className={cta}>
              Start a case
            </Link>
          </section>
        </main>
      </div>
    </>
  )
}

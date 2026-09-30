/**
 * Design direction: "Studio". A bright, plain product page for people who
 * write launch copy. The hero shows the product's own signature element, a
 * message with claims marked like highlighter strokes, instead of a poster.
 * Colour appears only where it carries meaning: orange for pushback, blue for
 * support. Copy is short and literal; no marketing adjectives.
 *
 * Landing page — a STATIC page (no DeepSpace providers, prerendered at build).
 */

import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { SampleMessage } from '../components/landing/SampleMessage'
import { Seo } from '../components/Seo'
import { seo } from '../seo'

const steps = [
  { title: 'Split into claims', body: 'Claude breaks your message into 3 to 5 checkable claims, each tied to the exact words it came from. Your team edits and approves them before anything is searched.' },
  { title: 'Search real discussion', body: 'A background job reads recent Hacker News comments and developer posts on dev.to and GitHub about each claim.' },
  { title: 'Verify every quote', body: 'Claude picks sentences that push back or support. Code then keeps a quote only if it appears word for word on the page. The rest are shown as removed, with the reason.' },
  { title: 'Decide together', body: 'Your team marks each quote relevant or off-topic, live, then writes version 2 and compares.' },
]

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div data-testid="static-landing" className="min-h-screen">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
          <span className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[17px] font-bold tracking-[-0.02em]">Objection</span>
          </span>
          <Link to="/home" className="inline-flex min-h-11 items-center rounded-[10px] bg-primary px-[18px] font-semibold text-primary-foreground no-underline hover:bg-primary/90">
            Open Objection
          </Link>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
          <section className="flex flex-wrap items-center gap-10 py-10 md:py-16">
            <div className="min-w-0 flex-[1_1_340px]">
              <h1 className="m-0 text-[clamp(34px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.03em]">Put your launch message on trial</h1>
              <p className="mt-5 max-w-[44ch] text-lg text-muted-foreground">
                Find out which of your claims developers push back on before you publish. Every objection comes with a real quote and a link to where it was said.
              </p>
              <Link to="/home" className="mt-7 inline-flex min-h-11 items-center rounded-[10px] bg-primary px-[18px] font-semibold text-primary-foreground no-underline hover:bg-primary/90">
                Start a case
              </Link>
            </div>
            <div className="min-w-0 flex-[1_1_440px]">
              <SampleMessage />
            </div>
          </section>

          <section aria-labelledby="how" className="border-t border-border py-12">
            <h2 id="how" className="m-0 mb-8 text-2xl font-bold tracking-[-0.02em]">How a trial works</h2>
            <ol className="m-0 grid list-none gap-x-10 gap-y-8 p-0 md:grid-cols-2">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground">{i + 1}</span>
                  <div>
                    <h3 className="m-0 text-base font-semibold">{s.title}</h3>
                    <p className="m-0 mt-1 text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="never" className="border-t border-border py-12">
            <h2 id="never" className="m-0 mb-4 text-2xl font-bold tracking-[-0.02em]">What the AI never does</h2>
            <p className="m-0 max-w-[62ch] text-muted-foreground">
              It never pretends to be a developer, never invents an opinion, and never has the final word. It splits claims and picks sentences. Code checks every quote, and your team decides what matters. Fewer quotes you can trust, instead of many fluent ones you cannot.
            </p>
          </section>
        </main>
      </div>
    </>
  )
}

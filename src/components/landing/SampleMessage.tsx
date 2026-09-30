/**
 * A sample message with claims marked, for the landing and signed-out home.
 * It shows the marking only: no quotes, so nothing here can be mistaken for
 * real evidence.
 */

import { MarkedMessage } from '../MarkedMessage'

const message = 'Your coding agent can ship a production app today. Auth, data, permissions and payments come built in.'

const claims = [
  { id: 's1', index: 1, span: 'Your coding agent can ship a production app today.', verdict: 'pushback' as const },
  { id: 's2', index: 2, span: 'Auth, data, permissions', verdict: 'support' as const },
  { id: 's3', index: 3, span: 'payments', verdict: 'none' as const },
]

export function SampleMessage() {
  return (
    <figure className="m-0 panel p-[clamp(22px,3vw,36px)]">
      <MarkedMessage message={message} claims={claims} selectedId="s1" size="md" />
      <figcaption className="mt-6 flex flex-col gap-1.5 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-push-text">1</span> Mostly pushback from developers.
        </span>
        <span>
          <span className="font-semibold text-support">2</span> Mostly support.
        </span>
        <span>
          <span className="font-semibold">3</span> Nobody is talking about it.
        </span>
        <span className="mt-2">Example message. Run your own to see real, verified quotes.</span>
      </figcaption>
    </figure>
  )
}

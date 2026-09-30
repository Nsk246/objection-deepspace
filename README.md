# Objection

Put your launch message on trial before real developers do. Every objection comes with receipts.

A team pastes a headline or pitch and names the audience. Objection splits the message into claims, finds recent developer discussion about each claim, pulls out exact sentences that push back on or support it, **checks in code that every quote is really on the source page**, and lets the team mark each quote Relevant or Off-topic together, live. Then they write version 2 and compare.

Built on [DeepSpace](https://docs.deep.space) (SDK 0.34.0).

## The flow

1. **Case.** Message under test plus the audience.
2. **Split into claims** (server action `splitClaims`). Claude returns 3 to 5 claims, each with the exact span of the message it came from. Code drops any claim whose span is not in the message.
3. **Human checkpoint.** The team rewords, approves or drops claims. Nothing paid runs yet.
4. **Run trial** (server action `startTrial`, then job `run-trial`). Per claim: reuse fresh team evidence, or search Hacker News and dev.to/GitHub, extract sentences with a stance, and verify each one word for word. Records appear live with job progress.
5. **Review together.** Everyone sees the same board and votes. Removed quotes stay visible, struck through, with the reason.
6. **New version and compare.**

## What the AI does, and what checks it

| Step | Who | Check |
|---|---|---|
| Split claims | Claude (`claude-sonnet-5`) | Span must be in the message (`isExactSpan`); team approves |
| Find pages | Plain code | Recency window, developer venues only |
| Pick quotes | Claude (`claude-haiku-4-5`) | Quote must be on the page word for word (`isVerbatim`) |
| Decide relevance | The team | Votes, one per person per quote |

## DeepSpace features used

| Feature | Why |
|---|---|
| Auth and protected routes | Paid search and AI calls are never public |
| Records with RBAC | Cases, claims, quotes, votes shared live; trust rules enforced in the Durable Object |
| Server actions | The only paths that spend owner credits; each checks state and a per-user daily cap |
| Background jobs | The search, extract, verify pipeline outlives a request and streams progress |
| Integration proxy (`exa/search`) | Page text from dev.to and GitHub with no API key in the app |
| AI proxy (`createDeepSpaceAI`) | Claim splitting and quote extraction, billed to the owner, no key in the app |
| Presence (`usePresenceRoom`) | Who else has the case open |

Left out on purpose: payments (nothing to sell), LiveKit (no gain for the core loop), chat UI (chat output cannot be verified), scheduled re-checks (next step), managed knowledge (plain records are enough at this size).

## Trust rules (enforced server-side)

- **Quotes** cannot be created or edited by any client role. Only the job writes them.
- **Claims** cannot be created by clients. Members may edit only `text`, `searchQuery` and `status`; the `span` is immutable.
- **Versions**: members create them, but only `caseId`, `number`, `message`. Status moves only through server actions and the job.
- **Votes**: one per user per quote (`uniqueOn`), bound to the caller's id, editable only by the voter.
- **Usage**: per-user daily counts, written only by server actions, readable only by the owner of the row.
- **Job queue**: members can watch progress; only admins can enqueue or cancel over the socket.

`src/schemas/objection-schemas.test.ts` checks these with the SDK's own permission functions.

## Where things are

```
src/config.ts                 every tunable: models, sources, caps, limits
src/lib/prompts.ts            both prompts and their JSON shapes
src/lib/verifyQuote.ts        the verbatim gate (+ test)
src/lib/sources.ts            HN Algolia and Exa scouts
src/lib/ai.ts                 the two AI calls
src/actions/index.ts          splitClaims, startTrial (cap checks)
src/jobs.ts                   run-trial pipeline (+ test)
src/schemas/objection-schemas.ts   collections and RBAC (+ test)
src/pages/(app)/(protected)/cases/[id].tsx   the evidence board
src/components/               MarkedMessage, ClaimRows, EvidenceList, ClaimReview, CompareVersions
AGENT_LOG.md                  what the coding agent did and what was verified
```

## Run it

Needs Node 22.15+ and npm 11.6+.

```sh
npm install
npx deepspace auth login     # GitHub or Google
npx deepspace dev start      # local dev
npm run type-check && npm run lint && npm run test:unit
npx deepspace deploy
```

No app secrets are needed: search and AI go through the DeepSpace proxy.

## Main tradeoff

Fewer quotes you can trust instead of many fluent ones you cannot. Strict word-for-word verification drops some real evidence (a quote the model reworded slightly). Lower recall, zero invented voices. People who post online skew vocal and negative, and the AI still chooses which sentences look relevant; team votes and visible removed counts limit that bias. It prepares you to talk to users; it does not replace it.

## Overlap with ThreadHunt

Objection reuses the background-job search pattern from DeepSpace's ThreadHunt on purpose. ThreadHunt finds threads to reply to. Objection checks whether your message survives contact with them.

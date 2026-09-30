# Agent log

What the coding agent (Claude Code) was asked, what it produced, what was wrong or risky, and what was verified or changed. Newest last. This feeds the submission writeup.

---

## 2026-09-30: Handoff review and day-one checks (session 1)

**Asked:** read `HANDOFF.md` and the design reference, run the day-one VERIFY checks, and report before building.

**Produced:** a findings report; no code.

**Verified against the real SDK (v0.34.0) and docs:**
- `exa/search` accepts `contents.text`, `includeDomains` and `startPublishedDate`, so one call returns page text. Tavily is not in the integration catalog.
- The HN Algolia `search` endpoint returns full comment HTML plus the item id for a link.
- `usePresenceRoom(scopeId)` fits "who is looking at this case"; `usePresence()` is app-wide online state.
- Models in the catalog: `claude-sonnet-5` (balanced) and `claude-haiku-4-5` (fast). `claude-opus-5` is now marked legacy.
- `create-deepspace` needs npm 11.6 or newer; the container had npm 10.9.

**Agent mistakes caught:**
- The agent first reported that `registerAgent` does not exist. It does: it lives in the scaffold file `src/ai/agent.ts`, not in the SDK exports. The handoff was right.
- The agent first told Nandhu to set `DEEPSPACE_EMAIL` / `DEEPSPACE_PASSWORD` as secrets. Those only work for test accounts; real accounts sign in with GitHub or Google. It was corrected to use the CLI session file instead.

**Plan changes proposed to Nandhu (from the docs), before building:**
1. Job socket writes are admin-only (the docs say jobs that spend owner credits should be). Members start trials only through a server action that checks the daily cap.
2. Quotes are `create: false` / `update: false` for every role. Only the job writes them.
3. Votes use `uniqueOn: ['quoteId', 'userId']` with `userBound` and `ownerField`, so the Durable Object enforces one vote per user per quote.
4. Team scope: the app is the team. Every signed-in member reads every case. No per-case sharing in v1.
5. Run the anti-AI gate on app pages too, not only the landing.

---

## 2026-09-30: Core build, offline (session 2)

**Asked:** continue the build from the handoff.

**Produced:** scaffold (`create-deepspace@0.34.0`), Studio theme, schemas and trust rules, `verifyQuote.ts` and its test, claim-split and start-trial server actions, the `run-trial` job, the evidence board UI, version compare, evidence memory, landing page.

**Decisions made while building (and why):**
- **Server actions instead of hand-written HTTP routes.** The docs recommend actions over ad-hoc endpoints: the worker verifies the JWT and hands the action RBAC-bypassing record tools. `splitClaims` and `startTrial` are the only two ways a client can spend owner credits.
- **`writableFields` on schemas.** The SDK supports per-role writable columns. Members can reword a claim (`text`, `searchQuery`, `status`) but cannot move its `span`. Members create a version (`caseId`, `number`, `message`) but cannot set its `status`; only the server moves status.
- **Counts are never stored.** Push/support/removed counts are derived from quote records on every render, so there is no count a client could inflate.
- **Search keywords per claim.** The HN Algolia API is keyword search, and a full claim sentence often matches nothing. The splitter also returns 2 to 5 search words per claim, and the team can edit them in the claim review. This was not in the handoff.
- **Votes follow the original quote.** When evidence memory reuses a quote, votes attach to the original (`reusedFrom`), so the team's earlier judgment carries over.
- **The job writes records through `buildCronContext`.** It is the SDK helper for owner-context worker code (cron and jobs), and uses the same RBAC-bypassing tools API as server actions.

**Checked in code, not just in the UI:**
- `src/lib/verifyQuote.test.ts`: the verbatim gate keeps exact quotes, whitespace and curly-quote variants and HTML-encoded sources; it rejects paraphrases, invented sentences, stitched quotes and fragments.
- `src/schemas/objection-schemas.test.ts`: uses the SDK's own `canCreate` / `canUpdate` / `checkFieldPermissions` / `lintSchemas` to prove clients cannot create or edit quotes, cannot create claims or usage rows, cannot move a claim span, cannot set a version status, and can only change their own vote.
- `src/jobs.test.ts`: the whole `run-trial` pipeline with search, AI and records faked (no paid calls). An invented quote is stored as removed with "Not on the source page". Fresh evidence is reused without searching again. A crash marks the version failed.

**Risky spots found in self-review and fixed:**
- Exa result URLs become "Open thread" links. They are now filtered to `http(s)` only, so a `javascript:` URL cannot reach the page.
- A double click on "Split into claims" could run two paid splits. The action now marks the version `splitting` before calling the AI.

**Known limits (not fixed):**
- The daily cap reads and then writes the usage row, so two requests in the same instant could both pass. At 5 trials per person the overspend is at most one trial. A Durable Object counter would close it.
- Nothing has run against the live platform yet. Blocked on DeepSpace login in this container (see README). Not yet verified live: Exa result shape (`data.results[].text`), HN fetch from the worker, AI proxy calls, presence.

**To verify by hand once deployed:**
- Run 3 real messages; read every kept quote against its source link.
- Try to create a quote from the browser console (`useMutations('quotes').create`); it must be refused.
- Two browsers on one case: votes and presence update live.

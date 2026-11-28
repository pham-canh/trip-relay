# Devpost submission copy

Live project: <https://devpost.com/software/trip-relay>. To update the submitted story, use the field-by-field edit sheet in [`docs/DEVPOST-EDIT.md`](DEVPOST-EDIT.md).

## Project name

Trip Relay

## Tagline

Two agentic travel sites, one visible boundary. Zero hotel requests before you press Allow.

## Inspiration

Agents are starting to use other websites on our behalf, but most demos hide the moment they cross an origin. A prompt-level "the assistant may contact partners" line is not consent: the user cannot see which origin, what request, or what leaves the page. Trip Relay makes that boundary the product instead of an implementation detail, using a flight-booking site and a hotel site that a traveler would actually use together.

The audience is specific: a traveler booking a trip that spans two suppliers, and the small airline or independent hotel that cannot run its own agent server. The booking needs a name and an email; the hotel is a different company. Today that exchange is invisible. Trip Relay turns it into a visible, reviewable handoff, and keeps the receipt on the traveler's side.

## What it does

**Before you press Allow, the hotel receives zero requests.** Trip Relay is a working pair of agentic websites. The airline and hotel are fictional, the inventory is generated, and no payment or real reservation is made.

- **Skyline Air** lets a visitor find a flight from Ho Chi Minh City to Da Nang, hold a fare, and book it. Its front agent delegates flight writes to a `fare_agent` specialist, and every write needs a current version and a visitor confirmation.
- **Harbor Hotel** is a separate origin with its own manifest, network, rooms, rates, policies, airport shuttle, and room-request intake.
- The airline's assistant can hand a hotel question to the second site. Before any request reaches the hotel origin (`localhost:8081` locally; `pham-canh.github.io.` hosted), the visitor sees a consent card with the exact origin, purpose, and request text. **Decline** cancels the call; the hotel manifest is never fetched. **Allow** loads only the hotel's public network and runs it in the caller's browser with the caller's router. The runtime forwards only the request text, which the consent card shows. It does not forward the chat history, page state, airline passenger record, or API key. A hotel room request is a separate action confirmed on the hotel origin.

- A **Privacy receipt** in the assistant drawer's **Receipt** tab lists every consent decision, peer fetch, peer failure, blocked value, and denied tool on the page. It verifies the hash chain in the browser and downloads the redacted log as JSON. The redacted chain is stored in this tab's IndexedDB and survives a reload; a tampered stored chain is refused, and **Clear receipt** starts a fresh chain. It is not a remote WORM store.
- A **keyless scripted demo** lets a judge see the real consent card and receipt without an Otari key. It uses the deterministic `browser://mock` router, makes one read or peer call, never calls a write tool, and contacts no provider.

The public demo runs at <https://pham-canh.github.io/trip-relay/> with the hotel at <https://pham-canh.github.io./>; the trailing dot is a deliberate second browser origin. **Do not drop the dot** — without it the hotel is on the airline's origin. The browser evidence is in [`docs/ORIGIN.md`](https://github.com/pham-canh/trip-relay/blob/main/docs/ORIGIN.md). The same pages run locally on `127.0.0.1:8080` and `localhost:8081` and work without a model key for the manual flight-booking and room-request paths. The assistant also has a keyless **Try the scripted demo (no key)** path that shows the consent card and receipt without contacting a provider.

Trip Relay is a **reference implementation of a consent-gated agent handoff**, not a travel-booking product. Travel is the demonstration domain; the data is generated and the pages take no payment or real reservation. The reusable contribution is the boundary: a peer network is public data, the browser pauses before the first peer fetch, the exact network is resolved with no fallback, and the peer receives the declared request rather than the caller's private context. The pattern, threat model, failure modes, and limitations are documented in [`PROTOCOL.md`](https://github.com/pham-canh/trip-relay/blob/main/PROTOCOL.md).

## Why this needs agents, not just a booking site

The plain Skyline Air site can sell a flight. The plain Harbor Hotel site can describe a room. Neither can answer the question a traveler actually has — “I land at 10:40; is there a quiet room near the airport, and can I bring the booking with me?” — because the answer spans two independent businesses. A link or a redirect loses the request; a hidden API call gives the traveler no say.

Trip Relay makes the handoff the product: the airline's assistant can ask the hotel's assistant, but the traveler sees the exact origin, purpose, and request before any byte crosses, and gets a receipt afterward. That is the agentic value: delegation across a boundary the traveler can see and control, not a chat box bolted onto a booking page. It also matches the open-agentic-web goal in the challenge's own framing: an independent hotel publishes its own representation, keeps its private operations private, and does not need a platform's permission to be reachable.

## Two signals to check

The challenge points judges at two built-in signals:

1. **The JSON that lists the connected network.** `site/agent-manifest.json` → `allowed_peers` names exactly `https://pham-canh.github.io.`, and `site/skyline_air.network.json` lists the hotel's `harbor_hotel` network as a tool. The hotel's manifest lists no further peers. `links.json` is intentionally empty for this partner: the spec's linking guide says not to use a link slot for a partner, because an unbound slot would ask the visitor for a URL and allow that origin for the whole page.
2. **The consent card.** Ask a hotel question on the airline page. The card appears before the first cross-origin fetch and shows the hotel origin, the purpose, and the exact request. The browser check asserts **0** hotel requests before **Allow** and **0** after **Decline**.

## Bring your own key

Trip Relay ships no provider token and does not pay for a visitor's inference. To use a real model, add your own Otari key in the assistant drawer's **Settings** tab; it stays in browser storage and is sent only to the selected router. Both manifests publish Otari as the default, with global and EU presets. No key? The keyless scripted demo shows the real consent card and receipt against a deterministic `browser://mock` router; it contacts no provider and is labeled `⚠ MOCK LLM` throughout. That keeps the demo reproducible for judging and matches the challenge's bring-your-own-key model: the visitor chooses the model and controls the cost.

## Community contribution

Trip Relay ships the boundary as reusable tooling, not only as a demo:

- [`scripts/check_origins.mjs`](https://github.com/pham-canh/trip-relay/blob/main/scripts/check_origins.mjs) — dependency-free check that a two-site pair is on distinct origins, both manifests load, the peer manifest is CORS-readable, and the caller's `allowed_peers` matches. Reusable by any two-origin submission.
- [`scripts/benchmark_dlp.mjs`](https://github.com/pham-canh/trip-relay/blob/main/scripts/benchmark_dlp.mjs) — deterministic 12-attack / 4-control matrix against the real dispatch boundary, with a per-run canary. Reusable as a template for hostile-peer testing.
- [`scripts/browser_check.mjs`](https://github.com/pham-canh/trip-relay/blob/main/scripts/browser_check.mjs) — 67-check Playwright pass covering consent ordering, receipt verify/download/reload/clear, hostile peer, mobile, keyboard, and the keyless demo. The 13-check hosted and 10-check demo variants run against the live pair.
- [`PROTOCOL.md`](https://github.com/pham-canh/trip-relay/blob/main/PROTOCOL.md) — the pattern, threat model, failure modes, and limits.
- [`docs/SPEC-MAPPING.md`](https://github.com/pham-canh/trip-relay/blob/main/docs/SPEC-MAPPING.md) — requirement-by-requirement map to MVP Profile 0.2.
- [`docs/COMMUNITY.md`](https://github.com/pham-canh/trip-relay/blob/main/docs/COMMUNITY.md) — what another team should copy, what to change, and what not to copy.

The pair is also listed on the challenge's official [agentic websites list](https://github.com/cognizant-ai-labs/agentic-web/blob/main/docs/agentic_websites.md) (PR #85, merged). MIT licensed; the vendored runtime keeps Apache 2.0.

## Demo video

<https://youtu.be/lDLhXmqXv6I>

The 1:46 cut shows a manual booking, the consent card, a decline with zero hotel requests, and an allow that loads the hotel's public network. It is narrated in Vietnamese by the entrant, with English subtitles burned into the picture and a full English transcript in [`VIDEO-TRANSCRIPT.md`](https://github.com/pham-canh/trip-relay/blob/main/docs/VIDEO-TRANSCRIPT.md). The recording uses a scripted OpenAI-compatible endpoint so the take is reproducible; the assistant header says `⚠ MOCK LLM — no real model`, and the narration says so. The public pair defaults to Otari. The entrant-voice file, the silent cut, the Vietnamese script, and the dubbing steps are in [`docs/DUB-VI.md`](DUB-VI.md).

## How we built it

- Two static sites, each with an `agent-manifest.json`, a resolved Neuro SAN HOCON network, `links.json`, a browser runtime, and a small action module.
- The airline network has a front agent plus a `fare_agent`; the hotel is a separate network reached through the exact `http://localhost:8081/harbor_hotel` link locally and `https://pham-canh.github.io./harbor_hotel` in the hosted pair.
- Consent is enforced by the runtime before the first peer fetch, not by the prompt. The browser test asserts zero requests to the hotel origin before **Allow**.
- Mozilla Otari is the default router in both manifests; the settings panel adds global and EU Otari presets with `alibaba/qwen-3.5-35b-a3b`. Keys stay in browser storage and go only to the selected router.
- The Skyline Air and Harbor Hotel interface, the assistant drawer, and the design QA pass are by Lolo (Euloge).
- 35 `node:test` checks run the real runtime with a scripted model: 13 DLP/audit checks, 3 receipt restore/tamper/clear checks, and 5 keyless-demo checks, plus the caller and peer suites. A 67-check Playwright browser pass covers both pages, the manual flight-booking path, the Privacy receipt (in-page verify, JSON download, reload restore, clear), the consent ordering, the approved cross-site answer, a peer 503, a hostile-peer outbound email block and inbound key block, phone layout and keyboard consent, and the keyless demo. The browser pass is committed as `scripts/browser_check.mjs`: `npm run check:browser` runs the 67 local checks, `npm run check:browser:live` repeats the 13 consent and receipt checks against the hosted pair, and `npm run check:browser:demo` runs 10 keyless-demo checks against the hosted pair. The separate `npm run benchmark:dlp` matrix runs 12 attacks and 4 controls. GitHub Actions runs the unit suite and the benchmark on every push. The visitor-facing receipt reads the same hash-chained log, patches `append()` so a new event appears without a reload, and persists the redacted chain in this tab's IndexedDB. A peer fetch failure writes a redacted `peer_error` event. The demo recording uses a scripted SSE router; the public pair defaults to Otari. The video says "fourteen tests" because it was recorded before the benchmark; the repository is current.

### Verification status

- **Protocol and consent:** 35 `node:test` checks and a 67-check Playwright browser pass, both with a scripted model and both committed in the repository. The browser pass asserts zero hotel requests before **Allow**, zero after **Decline**, and the hotel answer after **Allow**; it also verifies the Privacy receipt chain, downloads the JSON, reloads and verifies the restored chain, clears it, and checks that the export contains no email or key. A hostile-peer fixture proves a real outbound email block and a real inbound key block in the page, and a 503 fixture proves an actionable peer failure with a `peer_error` receipt. The keyless demo boots without a key, calls no provider, and writes the real consent and peer fetch to the receipt. A separate deterministic DLP benchmark runs 12 hostile-peer attacks and 4 controls against the real dispatch boundary: 12/12 blocked, 0 canary egress, 0 unauthorized writes, 4/4 controls pass, audit chain verifies. It is a Node-level benchmark, not a browser pass; the receipt is per-tab and local, not a remote WORM store.
- **Hosted boundary:** the deployed pair now serves the DLP runtime, the Privacy receipt with per-tab persistence, and the keyless demo. `npm run check:browser:live` repeated the 13 consent and receipt checks against the public pair on 2026-11-28 (13/13): `location.origin` is `https://pham-canh.github.io` on the airline and `https://pham-canh.github.io.` on the hotel; `localStorage` is isolated; the hotel manifest is CORS-readable; **0** requests before **Allow**, **0** after **Decline**, **11** after **Allow**; the receipt chain verifies; no console errors. `npm run check:browser:demo` repeated the 10 keyless-demo checks against the public pair (10/10): no provider request, the real consent card and hotel facts, a verified receipt, and a clean exit. A separate reload/clear smoke check also passed. `npm run check:origins` reproduces the deployment check. The full evidence is in [`docs/ORIGIN.md`](https://github.com/pham-canh/trip-relay/blob/main/docs/ORIGIN.md).
- **Official partner check:** the challenge's own `check_partner.mjs` returned `OK` for the hosted pair in both directions on 2026-11-28. It read the manifest, network, `links.json`, bridge page, bridge script, and bridge manifest with a caller `Origin`; all answered 200 with CORS; the hotel shares no actions with the caller; the airline's `allowed_peers` matches the hotel origin. Run it from a clone of [`cognizant-ai-labs/agentic-web`](https://github.com/cognizant-ai-labs/agentic-web): `node skills/agentify-website/scripts/check_partner.mjs https://pham-canh.github.io./harbor_hotel --origin https://pham-canh.github.io`.
- **Live Otari call:** not yet recorded. The tests and the demo video use a scripted OpenAI-compatible endpoint; the public manifests default to Otari. A judge can add a key in the assistant drawer's **Settings** tab and repeat the question. We do not claim a live provider call.
- **Scope:** demo data only. No real inventory, payment, or reservation. The contribution is the boundary, not the travel inventory.

## Challenges we ran into

- **Consent before contact.** The runtime must not prefetch peer metadata to render a nice card. The card shows the origin first and upgrades to the published brand only after approval.
- **Two origins without a second owner.** Locally, `127.0.0.1` and `localhost` are different origins; using two ports on one hostname would not exercise the boundary. On GitHub Pages, a project path shares the user origin, so the hosted pair uses the trailing-dot form of the same host (`pham-canh.github.io` vs `pham-canh.github.io.`), which browsers treat as a distinct origin.
- **Otari onboarding.** The local gateway needs Python 3.13 and uv 0.13+, and Docker was unavailable on the build machine, so the demo targets the hosted endpoint and documents the browser CORS requirement. The exact feedback is in `docs/OTARI.md`.
- **Otari regions.** An EU key sent to the global host returns HTTP 421 and names the correct host. The key prefix now selects the matching regional preset, so a judge does not have to discover the region by error. This was the most concrete integration bug we fixed.
- **Writes without false success.** Flight booking and room requests both require a current `expectedVersion`; a stale call is refused, and an unknown outcome is never retried.
- **Honest travel data.** Flights are generated for the next three days, rates are demo data, and the hotel takes requests only: the page says clearly that it has no live inventory and takes no payment.

## Accomplishments that we're proud of

- A visible, testable cross-origin consent gate with zero peer requests before approval.
- A two-agent caller network and a separate hotel network, both running in a normal browser tab.
- Per-origin private-context rules: only the natural-language request crosses the boundary.
- 35 unit tests, a 16-case hostile-peer DLP benchmark (12 attacks + 4 controls), 67 browser checks, and GitHub Actions on every push; the model is a scripted test double, not a live provider.
- A visitor-facing Privacy receipt that verifies the hash chain in the page, exports the redacted JSON, persists the redacted chain in the tab so a reload restores it, and makes the boundary observable without the developer trace.
- A keyless scripted demo that shows the real consent card and receipt without a provider key, and never calls a write tool.
- The same consent ordering was verified against the hosted GitHub Pages pair, including the trailing-dot second origin; that run also used a scripted endpoint, not a live Otari call.
- The challenge's own `check_partner.mjs` passes in both directions against the hosted pair, and the reusable boundary checks ship as three standalone scripts (`check_origins`, `benchmark_dlp`, `browser_check`).
- A complete spec map, demo script, screenshots, and a reproducible local setup with no server dependencies.

## What we learned

Consent has to live at the transport boundary. A sentence in the system prompt is not a control; the runtime must pause before the fetch and show the destination and payload. Treating peer networks as untrusted public data also keeps the key and the user's context on the caller's side.

## What's next for Trip Relay

- Record a take against a live Otari key over the same picture; the current entrant-voice cut uses a scripted, reproducible endpoint.
- Replace the trailing-dot peer host with a custom domain or a second static host when one is available; the public build already accepts `AIRLINE_URL` and `PEER_URL`.
- Add Playwright cases for the sandbox DOM/storage/network attempts and a spoofed consent card. The two-page consent, decline, receipt, hostile-peer outbound/inbound DLP, peer failure, mobile/keyboard, and keyless-demo checks now ship in `scripts/browser_check.mjs`.
- Add a remote append-only audit sink. The current receipt is per tab and stored in IndexedDB; the browser profile can still delete it.
- Extract the consent/policy layer into a small reusable library and add signed publisher identity.
- Add a second peer with a different trust level to show per-origin policies.
- Add an optional MCP facade and an A2A card.

## Built with

HTML, CSS, JavaScript, Node.js 22, Neuro SAN agent networks, Mozilla Otari, Playwright, GitHub Actions, GitHub Pages.

Devpost tags, one per entry:

- HTML
- CSS
- JavaScript
- Node.js
- Neuro SAN
- Mozilla Otari
- GitHub
- GitHub Actions
- Playwright
- GitHub Pages

## Try it

Public demo: <https://pham-canh.github.io/trip-relay/>. The hotel is at <https://pham-canh.github.io./>. The manual booking paths work without a key. For the cross-site answer, add a global `otk_...` key or an EU `otk_v1_eu_...` key in the assistant drawer's **Settings** tab; the regional preset fills the matching Otari router. After a hotel question, open the **Receipt** tab to verify the chain and download the redacted log.

Local:

```bash
npm test
npm run serve:airline   # terminal 1
npm run serve:hotel     # terminal 2
```

Open <http://127.0.0.1:8080/>. Without a key, open **Ask Skyline** and press **Try the scripted demo (no key)** to see the consent card and receipt; the demo is read-only and calls no provider.

## Project media captions

Upload the screenshots in this order; each caption is under 140 characters.

1. `docs/screenshots/airline-hero.png` — Skyline Air landing page: book a flight, then ask the hotel — with a visible consent boundary.
2. `docs/screenshots/hotel_hero.png` — Harbor Hotel on its own origin: a separate site, manifest, rooms, rates, and concierge.
3. `docs/screenshots/airline-booking.png` — A manual booking: pick a flight, enter the passenger, and confirm; the demo takes no payment.
4. `docs/screenshots/consent.png` — The consent card shows the exact hotel origin, purpose, and request before any cross-origin fetch.
5. `docs/screenshots/assistant-answer.png` — After Allow: the hotel network runs in the browser and returns a room answer; only the request text crossed.
6. `docs/screenshots/privacy-receipt.png` — The Receipt tab from the keyless demo lists the consent, the peer fetch, and any blocked value; the hash chain verifies, survives a reload, and exports as JSON.
7. `docs/screenshots/hotel-mobile.png` — Harbor Hotel at a phone width, with its own manifest, rooms, and policies.

## Links

- Repository: <https://github.com/pham-canh/trip-relay>
- Protocol note: <https://github.com/pham-canh/trip-relay/blob/main/PROTOCOL.md>
- Live demo: <https://pham-canh.github.io/trip-relay/> (hotel: <https://pham-canh.github.io./>)
- Demo video: <https://youtu.be/lDLhXmqXv6I> (entrant-voice cut, 1:46, English subtitles burned in)
- Video transcript (English): <https://github.com/pham-canh/trip-relay/blob/main/docs/VIDEO-TRANSCRIPT.md>
- Otari account email: `crytobot459@gmail.com`

## Additional info (judges only)

- **Public open agentic site:** <https://pham-canh.github.io/trip-relay/> (the airline entry point; the hotel is the separate origin at <https://pham-canh.github.io./>).
- **How it maps to the judging criteria:** the office-hour Q&A lists five Stage Two criteria: technological implementation, design, potential impact, community contribution, and quality of the idea.
  - **Technological implementation:** a spec-conformant manifest/network/links bundle, a browser runtime that loads and runs the peer's data-only network locally, a consent gate before the first peer fetch, DLP at every egress, and a hash-chained audit log. The challenge's own `check_partner.mjs` passes for both hosted directions.
  - **Design:** one coherent travel flow (find a flight, book it, ask the hotel), a consent card that names the origin and exact request, a visitor-facing Privacy receipt, manual paths that work without a key, and a mobile layout.
  - **Potential impact:** a concrete case for cross-supplier travel: the traveler sees and approves the handoff, while a small airline or independent hotel can join the agentic web without running an agent server or receiving the traveler's key.
  - **Community contribution:** MIT-licensed `scripts/check_origins.mjs`, `scripts/benchmark_dlp.mjs`, and `scripts/browser_check.mjs`, the protocol note, and the spec map; the scripts are standalone Node tools that other two-origin pairs can reuse. The pair is on the challenge's official [`agentic_websites.md`](https://github.com/cognizant-ai-labs/agentic-web/blob/main/docs/agentic_websites.md) list (PR [#85](https://github.com/cognizant-ai-labs/agentic-web/pull/85), merged).
  - **Quality of the idea:** consent is treated as a product surface and a transport invariant, not a prompt sentence; the demo makes the invisible origin crossing visible and testable.
- **Judge guide:** [`docs/JUDGE-GUIDE.md`](https://github.com/pham-canh/trip-relay/blob/main/docs/JUDGE-GUIDE.md) is a one-page path through the demo, the two built-in signals, what is real vs scripted, BYOK, and the community tools.
- **Screenshot:** `docs/screenshots/airline-hero.png`; privacy receipt: `docs/screenshots/privacy-receipt.png`.
- **Upload a file:** leave blank; the public repository, `PROTOCOL.md`, `docs/ORIGIN.md`, and the transcript are the evidence bundle.
- **Additional tool URL:** <https://github.com/pham-canh/trip-relay/blob/main/scripts/check_origins.mjs>.
- **Benchmark:** `npm run benchmark:dlp` runs the deterministic 12-attack/4-control matrix against the real dispatch boundary. Committed report: <https://github.com/pham-canh/trip-relay/blob/main/docs/dlp-benchmark.json>; source: <https://github.com/pham-canh/trip-relay/blob/main/scripts/benchmark_dlp.mjs>; scope: <https://github.com/pham-canh/trip-relay/blob/main/docs/ROADMAP-DLP.md>.
- **Additional tool description:** `scripts/check_origins.mjs` is a dependency-free Node.js check for the deployed pair. It verifies that the airline and hotel resolve to different browser origins (the hotel host keeps its deliberate trailing dot), that both manifests are reachable, that the hotel manifest is CORS-readable from the airline, that the airline lists the hotel origin as an allowed peer, that the hotel allows no further peers, and that the hotel network publishes tools. Run it with `npm run check:origins`; the browser-level evidence, including localStorage isolation and the 0/0/11 consent request counts, is in `docs/ORIGIN.md`.

## Update draft (post-submission)

Post this in **Updates** only after the code and docs are pushed. It is a progress log, not a replacement for the project story. The benchmark, the receipt UI, per-tab persistence, the keyless demo, and the expanded browser pass are implemented and measured; the remote audit sink is not.

```markdown
## Update: hostile-peer DLP passes 12/12, and the privacy receipt survives a reload

The Trip Relay repository now ships a deterministic hostile-peer benchmark, a visitor-facing privacy receipt, and a keyless scripted demo. A malicious hotel network tries to obtain the passenger email, bypass consent, and execute a caller tool; every attempt is blocked and recorded.

**Results**
- 12/12 attacks blocked
- 0 canary egress
- 0 unauthorized tool executions
- 0 consent bypasses
- 0 PII in raw audit fields
- 4/4 legitimate controls pass
- audit hash chain verifies
- 35/35 unit tests and 67/67 local browser checks; 13/13 hosted consent/receipt checks and 10/10 hosted demo checks

**What changed**
- Per-run canary email; DLP at peer egress, coded-tool args, `sly_data`, and peer output.
- “Always allow” is bound to origin + request hash + kind + phase, with a 5-minute expiry.
- Caller writes are denied to a non-top peer; unlisted origins fail closed.
- Hash-chained, redacted audit log with export and verification.
- A visitor-facing **Privacy receipt** in the assistant drawer's **Receipt** tab: verify the chain in the page, download the redacted JSON, and see the consent, peer fetch, peer failure, and any blocked value. The redacted chain is stored in this tab's IndexedDB, so a reload restores it; a tampered store is refused, and **Clear receipt** starts a new chain.
- A committed browser pass (`scripts/browser_check.mjs`): 67 local checks, 13 hosted consent/receipt checks, and 10 hosted demo checks. It covers both pages, the manual booking path, the receipt verify/download/reload/clear, zero hotel requests before **Allow**, zero after **Decline**, the approved cross-site answer, a peer 503, a hostile-peer outbound email block and inbound key block, phone layout and keyboard consent, and the keyless demo.
- `npm test` now includes 13 DLP/audit checks, 3 receipt restore/tamper/clear checks, and 5 keyless-demo checks (35 total).

**Scope**
The DLP benchmark is deterministic Node code on the real dispatch boundary, not a browser test; the separate browser pass covers the two pages, the consent ordering, the decline, the receipt, the hostile-peer blocks, the peer failure, and the demo. The receipt is per tab and local, not a remote WORM store. The submitted video was recorded before this work, so it says “fourteen tests”; the repository and the live pair are current. The remaining sandbox/spoofed-card browser cases, remote audit sink, per-peer `peer_tools` grant, and signed publisher identity are listed in the roadmap.

Run: `npm run benchmark:dlp`
Report: https://github.com/pham-canh/trip-relay/blob/main/docs/dlp-benchmark.json
Browser: `npm run check:browser` / `npm run check:browser:live` / `npm run check:browser:demo`
Spec: https://github.com/pham-canh/trip-relay/blob/main/docs/ROADMAP-DLP.md
```

## Before submitting

- [x] **Publish the two sites to two public origins.** Airline: <https://pham-canh.github.io/trip-relay/>; hotel: <https://pham-canh.github.io./> (trailing-dot origin).
- [x] Record the 1:45 cut (`docs/trip-relay-demo.mp4`) and the silent cut (`docs/trip-relay-demo-silent.mp4`).
- [x] Record the entrant-voice take and mux it to `docs/trip-relay-demo-own-voice.mp4` (1:45.5). The retimed Vietnamese and English captions are ready.
- [x] Upload `docs/trip-relay-demo-own-voice.mp4` to YouTube as **Public** at <https://youtu.be/lDLhXmqXv6I> (1:46). The English subtitles are burned in, so no English caption track is needed.
- [ ] Replace the YouTube thumbnail with `docs/youtube-thumbnail.png`; the current thumbnail is a video frame with the developer panel.
- [x] Confirm the final video has English subtitles burned into the picture and that `docs/VIDEO-TRANSCRIPT.md` is linked in the submission. The language rule allows Vietnamese audio with an English translation.
- [x] Submit the Devpost form with the copy above.
- [x] Add the Otari account email (`crytobot459@gmail.com`) and check the problem/improvement text in `docs/OTARI.md`.
- [ ] Revoke any Otari key used during development and confirm no key is in the repo or screenshots.
- [x] Confirm the repository is public and the license is visible.
- [ ] Upload the repository social preview (`docs/social-preview.png`) and pin the repo if it belongs in the portfolio.
- [x] Re-run `npm test` after the last code change (35/35 pass).
- [x] Re-run `npm run check:browser` after the last code change (67/67 pass), `npm run check:browser:live` (13/13 pass), and `npm run check:browser:demo` (10/10 pass).
- [x] Run `npm run benchmark:dlp` (12/12 attacks blocked, 4/4 controls pass).
- [x] Push `main` so `PROTOCOL.md`, `scripts/build_public.mjs`, and the demo docs stop 404ing on GitHub.
- [x] Keep the Devpost confirmation email; edit the project story if any claim changes, and post the DLP update separately.

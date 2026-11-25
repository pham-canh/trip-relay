# Devpost submission copy

## Project name

Trip Relay

## Tagline

Two agentic travel websites, one visible consent boundary.

## Inspiration

Agents are starting to use other websites on our behalf, but most demos hide the moment they cross an origin. A prompt-level "the assistant may contact partners" line is not consent: the user cannot see which origin, what request, or what leaves the page. Trip Relay makes that boundary the product instead of an implementation detail, using a flight-booking site and a hotel site that a traveler would actually use together.

## What it does

Trip Relay is a working pair of agentic websites. The airline and hotel are fictional, the inventory is generated, and no payment or real reservation is made.

- **Skyline Air** lets a visitor find a flight from Ho Chi Minh City to Da Nang, hold a fare, and book it. Its front agent delegates flight writes to a `fare_agent` specialist, and every write needs a current version and a visitor confirmation.
- **Harbor Hotel** is a separate origin with its own manifest, network, rooms, rates, policies, airport shuttle, and room-request intake.
- The airline's assistant can hand a hotel question to the second site. Before any request reaches the hotel origin (`localhost:8081` locally; `pham-canh.github.io.` hosted), the visitor sees a consent card with the exact origin, purpose, and request text. **Decline** cancels the call; the hotel manifest is never fetched. **Allow** loads only the hotel's public network and runs it in the caller's browser with the caller's router. The runtime forwards only the request text, which the consent card shows. It does not forward the chat history, page state, airline passenger record, or API key. A hotel room request is a separate action confirmed on the hotel origin.

The public demo runs at <https://pham-canh.github.io/trip-relay/> with the hotel at <https://pham-canh.github.io./>; the trailing dot is a deliberate second browser origin. **Do not drop the dot** — without it the hotel is on the airline's origin. The browser evidence is in [`docs/ORIGIN.md`](https://github.com/pham-canh/trip-relay/blob/main/docs/ORIGIN.md). The same pages run locally on `127.0.0.1:8080` and `localhost:8081` and work without a model key for the manual flight-booking and room-request paths.

Trip Relay is a **reference implementation of a consent-gated agent handoff**, not a travel-booking product. Travel is the demonstration domain; the data is generated and the pages take no payment or real reservation. The reusable contribution is the boundary: a peer network is public data, the browser pauses before the first peer fetch, the exact network is resolved with no fallback, and the peer receives the declared request rather than the caller's private context. The pattern, threat model, failure modes, and limitations are documented in [`PROTOCOL.md`](https://github.com/pham-canh/trip-relay/blob/main/PROTOCOL.md).

## Demo video

<https://youtu.be/lDLhXmqXv6I>

The 1:46 cut shows a manual booking, the consent card, a decline with zero hotel requests, and an allow that loads the hotel's public network. It is narrated in Vietnamese by the entrant, with English subtitles burned into the picture and a full English transcript in [`VIDEO-TRANSCRIPT.md`](https://github.com/pham-canh/trip-relay/blob/main/docs/VIDEO-TRANSCRIPT.md). The recording uses a scripted OpenAI-compatible endpoint so the take is reproducible; the assistant header says `⚠ MOCK LLM — no real model`, and the narration says so. The public pair defaults to Otari. The entrant-voice file, the silent cut, the Vietnamese script, and the dubbing steps are in [`docs/DUB-VI.md`](DUB-VI.md).

## How we built it

- Two static sites, each with an `agent-manifest.json`, a resolved Neuro SAN HOCON network, `links.json`, a browser runtime, and a small action module.
- The airline network has a front agent plus a `fare_agent`; the hotel is a separate network reached through the exact `http://localhost:8081/harbor_hotel` link locally and `https://pham-canh.github.io./harbor_hotel` in the hosted pair.
- Consent is enforced by the runtime before the first peer fetch, not by the prompt. The browser test asserts zero requests to the hotel origin before **Allow**.
- Mozilla Otari is the default router in both manifests; the settings panel adds global and EU Otari presets with `alibaba/qwen-3.5-35b-a3b`. Keys stay in browser storage and go only to the selected router.
- 27 `node:test` checks run the real runtime with a scripted model, including 13 DLP/audit checks; a 16-check Playwright pass covers both pages, the consent ordering, and the approved cross-site answer. The separate `npm run benchmark:dlp` matrix runs 12 attacks and 4 controls. GitHub Actions runs both on every push. The demo recording uses a scripted SSE router; the public pair defaults to Otari. The video says "fourteen tests" because it was recorded before the benchmark; the repository is current.

### Verification status

- **Protocol and consent:** 27 `node:test` checks and a 16-check Playwright pass, both with a scripted model. The browser pass asserts zero hotel requests before **Allow**, zero after **Decline**, and the hotel answer after **Allow**. A separate deterministic DLP benchmark runs 12 hostile-peer attacks and 4 controls against the real dispatch boundary: 12/12 blocked, 0 canary egress, 0 unauthorized writes, 4/4 controls pass, audit chain verifies. It is a Node-level benchmark, not a browser pass; the audit log is session-only.
- **Hosted boundary:** the same consent flow was run against the public pair. `location.origin` is `https://pham-canh.github.io` on the airline and `https://pham-canh.github.io.` on the hotel; `localStorage` is isolated; the hotel manifest is CORS-readable; **0** requests before **Allow**, **0** after **Decline**, **11** after **Allow**. `npm run check:origins` reproduces the deployment check. The full evidence is in [`docs/ORIGIN.md`](https://github.com/pham-canh/trip-relay/blob/main/docs/ORIGIN.md).
- **Live Otari call:** not yet recorded. The tests and the demo video use a scripted OpenAI-compatible endpoint; the public manifests default to Otari. A judge can add a key in **AI model settings** and repeat the question. We do not claim a live provider call.
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
- 27 unit tests, a 16-case hostile-peer DLP benchmark, 16 browser checks, and GitHub Actions on every push; the model is a scripted test double, not a live provider.
- The same consent ordering was verified against the hosted GitHub Pages pair, including the trailing-dot second origin; that run also used a scripted endpoint, not a live Otari call.
- A complete spec map, demo script, screenshots, and a reproducible local setup with no server dependencies.

## What we learned

Consent has to live at the transport boundary. A sentence in the system prompt is not a control; the runtime must pause before the fetch and show the destination and payload. Treating peer networks as untrusted public data also keeps the key and the user's context on the caller's side.

## What's next for Trip Relay

- Record a take against a live Otari key over the same picture; the current entrant-voice cut uses a scripted, reproducible endpoint.
- Replace the trailing-dot peer host with a custom domain or a second static host when one is available; the public build already accepts `AIRLINE_URL` and `PEER_URL`.
- Extend the DLP benchmark into the browser UI: Playwright cases for the sandbox, a spoofed consent card, and IndexedDB audit download/verify.
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

Public demo: <https://pham-canh.github.io/trip-relay/>. The hotel is at <https://pham-canh.github.io./>. The manual booking paths work without a key. For the cross-site answer, add a global `otk_...` key or an EU `otk_v1_eu_...` key in **AI model settings**; the regional preset fills the matching Otari router.

Local:

```bash
npm test
npm run serve:airline   # terminal 1
npm run serve:hotel     # terminal 2
```

Open <http://127.0.0.1:8080/>.

## Project media captions

Upload the screenshots in this order; each caption is under 140 characters.

1. `docs/screenshots/airline-hero.png` — Skyline Air landing page: book a flight, then ask the hotel — with a visible consent boundary.
2. `docs/screenshots/consent.png` — The consent card shows the exact hotel origin, purpose, and request before any cross-origin fetch.
3. `docs/screenshots/assistant-answer.png` — After Allow: the hotel network runs in the browser and returns a room answer; only the request text crossed.
4. `docs/screenshots/airline-booking.png` — A manual booking: pick a flight, enter the passenger, and confirm; the demo takes no payment.
5. `docs/screenshots/hotel-mobile.png` — Harbor Hotel on its own origin at a phone width: separate manifest, rooms, and policies.

## Links

- Repository: <https://github.com/pham-canh/trip-relay>
- Protocol note: <https://github.com/pham-canh/trip-relay/blob/main/PROTOCOL.md>
- Live demo: <https://pham-canh.github.io/trip-relay/> (hotel: <https://pham-canh.github.io./>)
- Demo video: <https://youtu.be/lDLhXmqXv6I> (entrant-voice cut, 1:46, English subtitles burned in)
- Video transcript (English): <https://github.com/pham-canh/trip-relay/blob/main/docs/VIDEO-TRANSCRIPT.md>
- Otari account email: `crytobot459@gmail.com`

## Additional info (judges only)

- **Public open agentic site:** <https://pham-canh.github.io/trip-relay/> (the airline entry point; the hotel is the separate origin at <https://pham-canh.github.io./>).
- **Screenshot:** `docs/screenshots/airline-hero.png`.
- **Upload a file:** leave blank; the public repository, `PROTOCOL.md`, `docs/ORIGIN.md`, and the transcript are the evidence bundle.
- **Additional tool URL:** <https://github.com/pham-canh/trip-relay/blob/main/scripts/check_origins.mjs>.
- **Benchmark:** `npm run benchmark:dlp` runs the deterministic 12-attack/4-control matrix against the real dispatch boundary. Committed report: <https://github.com/pham-canh/trip-relay/blob/main/docs/dlp-benchmark.json>; source: <https://github.com/pham-canh/trip-relay/blob/main/scripts/benchmark_dlp.mjs>; scope: <https://github.com/pham-canh/trip-relay/blob/main/docs/ROADMAP-DLP.md>.
- **Additional tool description:** `scripts/check_origins.mjs` is a dependency-free Node.js check for the deployed pair. It verifies that the airline and hotel resolve to different browser origins (the hotel host keeps its deliberate trailing dot), that both manifests are reachable, that the hotel manifest is CORS-readable from the airline, that the airline lists the hotel origin as an allowed peer, that the hotel allows no further peers, and that the hotel network publishes tools. Run it with `npm run check:origins`; the browser-level evidence, including localStorage isolation and the 0/0/11 consent request counts, is in `docs/ORIGIN.md`.

## Update draft (post-submission)

Post this in **Updates** only after the code and docs are pushed. It is a progress log, not a replacement for the project story. The benchmark is implemented and measured; the browser UI and remote audit sink are not.

```markdown
## Update: hostile-peer DLP benchmark passes 12/12

The Trip Relay repository now ships a deterministic hostile-peer benchmark. A malicious hotel network tries to obtain the passenger email, bypass consent, and execute a caller tool; every attempt is blocked and recorded.

**Results**
- 12/12 attacks blocked
- 0 canary egress
- 0 unauthorized tool executions
- 0 consent bypasses
- 0 PII in raw audit fields
- 4/4 legitimate controls pass
- audit hash chain verifies

**What changed**
- Per-run canary email; DLP at peer egress, coded-tool args, `sly_data`, and peer output.
- “Always allow” is bound to origin + request hash + kind + phase, with a 5-minute expiry.
- Caller writes are denied to a non-top peer; unlisted origins fail closed.
- Hash-chained, redacted audit log with export and verification.
- `npm test` now includes 13 DLP/audit checks (27 total).

**Scope**
This is a deterministic Node benchmark on the real dispatch boundary, not a Playwright browser pass. The audit log is session-only, not a remote WORM store. The submitted video was recorded before this benchmark, so it says “fourteen tests”; the repository is current. The remaining browser matrix, IndexedDB download/verify UI, per-peer `peer_tools` grant, and signed publisher identity are listed in the roadmap.

Run: `npm run benchmark:dlp`
Report: https://github.com/pham-canh/trip-relay/blob/main/docs/dlp-benchmark.json
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
- [x] Re-run `npm test` after the last code change (27/27 pass).
- [x] Run `npm run benchmark:dlp` (12/12 attacks blocked, 4/4 controls pass).
- [x] Push `main` so `PROTOCOL.md`, `scripts/build_public.mjs`, and the demo docs stop 404ing on GitHub.
- [x] Keep the Devpost confirmation email; edit the project story if any claim changes, and post the DLP update separately.

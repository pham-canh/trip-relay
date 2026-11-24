# Devpost submission copy

## Project name

Trip Relay

## Tagline

Two agentic travel websites, one visible consent boundary.

## Inspiration

Agents are starting to use other websites on our behalf, but most demos hide the moment they cross an origin. A prompt-level "the assistant may contact partners" line is not consent: the user cannot see which origin, what request, or what leaves the page. Trip Relay makes that boundary the product instead of an implementation detail, using a flight-booking site and a hotel site that a traveler would actually use together.

## What it does

Trip Relay is a working pair of agentic websites:

- **Skyline Air** lets a visitor find a flight from Ho Chi Minh City to Da Nang, hold a fare, and book it. Its front agent delegates flight writes to a `fare_agent` specialist, and every write needs a current version and a visitor confirmation.
- **Harbor Hotel** is a separate origin with its own manifest, network, rooms, rates, policies, airport shuttle, and room-request intake.
- The airline's assistant can hand a hotel question to the second site. Before any request reaches the hotel origin (`localhost:8081` locally; `pham-canh.github.io.` hosted), the visitor sees a consent card with the exact origin, purpose, and request text. **Decline** cancels the call; the hotel manifest is never fetched. **Allow** loads only the hotel's public network and runs it in the caller's browser with the caller's router. The runtime forwards only the request text, which the consent card shows. It does not forward the chat history, page state, airline passenger record, or API key. A hotel room request is a separate action confirmed on the hotel origin.

The public demo runs at <https://pham-canh.github.io/trip-relay/> with the hotel at <https://pham-canh.github.io./>; the trailing dot is a deliberate second browser origin. The same pages run locally on `127.0.0.1:8080` and `localhost:8081` and work without a model key for the manual flight-booking and room-request paths.

Trip Relay is a **reference implementation of a consent-gated agent handoff**, not a travel-booking product. Travel is the demonstration domain. The reusable contribution is the boundary: a peer network is public data, the browser pauses before the first peer fetch, the exact network is resolved with no fallback, and the peer receives the declared request rather than the caller's private context. The pattern, threat model, failure modes, and limitations are documented in [`PROTOCOL.md`](https://github.com/pham-canh/trip-relay/blob/main/PROTOCOL.md).

## Demo video

`[ADD YOUTUBE LINK]`

The 1:45 cut shows a manual booking, the consent card, a decline with zero hotel requests, and an allow that loads the hotel's public network. The recording uses a scripted OpenAI-compatible endpoint so the take is reproducible; the assistant header says `⚠ MOCK LLM — no real model`, and the narration says so. The public pair uses Otari. The silent cut and the entrant-voice dubbing steps are in [`docs/DUB.md`](DUB.md).

## How we built it

- Two static sites, each with an `agent-manifest.json`, a resolved Neuro SAN HOCON network, `links.json`, a browser runtime, and a small action module.
- The airline network has a front agent plus a `fare_agent`; the hotel is a separate network reached through the exact `http://localhost:8081/harbor_hotel` link locally and `https://pham-canh.github.io./harbor_hotel` in the hosted pair.
- Consent is enforced by the runtime before the first peer fetch, not by the prompt. The browser test asserts zero requests to the hotel origin before **Allow**.
- Mozilla Otari is the default router in both manifests; the settings panel adds global and EU Otari presets with `alibaba/qwen-3.5-35b-a3b`. Keys stay in browser storage and go only to the selected router.
- 14 `node:test` checks run the real runtime with a scripted model; a 16-check Playwright pass covers both pages, the consent ordering, and the approved cross-site answer. GitHub Actions runs the suite on every push. The demo recording uses a scripted SSE router; the public pair defaults to Otari.

## Challenges

- **Consent before contact.** The runtime must not prefetch peer metadata to render a nice card. The card shows the origin first and upgrades to the published brand only after approval.
- **Two origins without a second owner.** Locally, `127.0.0.1` and `localhost` are different origins; using two ports on one hostname would not exercise the boundary. On GitHub Pages, a project path shares the user origin, so the hosted pair uses the trailing-dot form of the same host (`pham-canh.github.io` vs `pham-canh.github.io.`), which browsers treat as a distinct origin.
- **Otari onboarding.** The local gateway needs Python 3.13 and uv 0.13+, and Docker was unavailable on the build machine, so the demo targets the hosted endpoint and documents the browser CORS requirement. The exact feedback is in `docs/OTARI.md`.
- **Otari regions.** An EU key sent to the global host returns HTTP 421 and names the correct host. The key prefix now selects the matching regional preset, so a judge does not have to discover the region by error. This was the most concrete integration bug we fixed.
- **Writes without false success.** Flight booking and room requests both require a current `expectedVersion`; a stale call is refused, and an unknown outcome is never retried.
- **Honest travel data.** Flights are generated for the next three days, rates are demo data, and the hotel takes requests only: the page says clearly that it has no live inventory and takes no payment.

## Accomplishments

- A visible, testable cross-origin consent gate with zero peer requests before approval.
- A two-agent caller network and a separate hotel network, both running in a normal browser tab.
- Per-origin private-context rules: only the natural-language request crosses the boundary.
- 14 unit tests, 16 browser checks, and GitHub Actions on every push.
- The same consent ordering was verified against the hosted GitHub Pages pair, including the trailing-dot second origin.
- A complete spec map, demo script, screenshots, and a reproducible local setup with no server dependencies.

## What we learned

Consent has to live at the transport boundary. A sentence in the system prompt is not a control; the runtime must pause before the fetch and show the destination and payload. Treating peer networks as untrusted public data also keeps the key and the user's context on the caller's side.

## What's next

- Record a live Otari take with the entrant's own voice; the current cut is a scripted, reproducible take.
- Replace the trailing-dot peer host with a custom domain or a second static host when one is available; the public build already accepts `AIRLINE_URL` and `PEER_URL`.
- Extract the consent/policy layer into a small reusable library and add signed publisher identity.
- Add a second peer with a different trust level to show per-origin policies.
- Add an optional MCP facade and an A2A card.

## Built with

HTML, CSS, JavaScript, Node.js 22, Neuro SAN agent networks, Mozilla Otari, Playwright, GitHub Actions.

## Try it

Public demo: <https://pham-canh.github.io/trip-relay/>. The hotel is at <https://pham-canh.github.io./>. The manual booking paths work without a key. For the cross-site answer, add a global `otk_...` key or an EU `otk_v1_eu_...` key in **AI model settings**; the regional preset fills the matching Otari router.

Local:

```bash
npm test
npm run serve:airline   # terminal 1
npm run serve:hotel     # terminal 2
```

Open <http://127.0.0.1:8080/>.

## Links

- Repository: <https://github.com/pham-canh/trip-relay>
- Protocol note: <https://github.com/pham-canh/trip-relay/blob/main/PROTOCOL.md>
- Live demo: <https://pham-canh.github.io/trip-relay/> (hotel: <https://pham-canh.github.io./>)
- Demo video: `[ADD YOUTUBE LINK]`
- Otari account email: `crytobot459@gmail.com`

## Before submitting

- [x] **Publish the two sites to two public origins.** Airline: <https://pham-canh.github.io/trip-relay/>; hotel: <https://pham-canh.github.io./> (trailing-dot origin).
- [x] Record the 1:45 cut (`docs/trip-relay-demo.mp4`) and the silent cut (`docs/trip-relay-demo-silent.mp4`).
- [ ] Upload the video to YouTube and replace the link above. Use `docs/YOUTUBE.md`; re-record the voice with `docs/DUB.md` if the rules require the entrant's own voice.
- [x] Add the Otari account email (`crytobot459@gmail.com`) and check the problem/improvement text in `docs/OTARI.md`.
- [ ] Revoke any Otari key used during development and confirm no key is in the repo or screenshots.
- [x] Confirm the repository is public and the license is visible.
- [ ] Upload the repository social preview (`docs/social-preview.png`) and pin the repo if it belongs in the portfolio.
- [x] Re-run `npm test` after the last code change (14/14 pass).
- [ ] Push `main` so `PROTOCOL.md`, `scripts/build_public.mjs`, and the demo docs stop 404ing on GitHub.
- [ ] Open the Devpost form, paste this copy, add the screenshots and video link, and submit.

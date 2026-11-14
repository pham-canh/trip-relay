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
- The airline's assistant can hand a hotel question to the second site. Before any request reaches `localhost:8081`, the visitor sees a consent card with the exact origin, purpose, and request text. **Decline** cancels the call; the hotel manifest is never fetched. **Allow** loads only the hotel's public network and runs it in the caller's browser with the caller's router. The hotel never receives the chat history, page state, passenger name, email, or API key.

The demo runs both sites locally on two origins (`127.0.0.1:8080` and `localhost:8081`) and works without a model key for the manual flight-booking and room-request paths.

## How we built it

- Two static sites, each with an `agent-manifest.json`, a resolved Neuro SAN HOCON network, `links.json`, a browser runtime, and a small action module.
- The airline network has a front agent plus a `fare_agent`; the hotel is a separate network reached through the exact `http://localhost:8081/harbor_hotel` link.
- Consent is enforced by the runtime before the first peer fetch, not by the prompt. The browser test asserts zero requests to the hotel origin before **Allow**.
- Mozilla Otari is the default router in both manifests; the settings panel adds an Otari preset with `alibaba/qwen-3.5-35b-a3b`. Keys stay in browser storage and go only to the selected router.
- 13 `node:test` checks run the real runtime with a scripted model; a 16-check Playwright pass covers both pages, the consent ordering, and the approved cross-site answer. GitHub Actions runs the suite on every push.

## Challenges

- **Consent before contact.** The runtime must not prefetch peer metadata to render a nice card. The card shows the origin first and upgrades to the published brand only after approval.
- **Two origins on one machine.** `127.0.0.1` and `localhost` are different origins; using two ports on one hostname would not exercise the boundary.
- **Otari onboarding.** The local gateway needs Python 3.13 and uv 0.13+, and Docker was unavailable on the build machine, so the demo targets the hosted endpoint and documents the browser CORS requirement. The exact feedback is in `docs/OTARI.md`.
- **Writes without false success.** Flight booking and room requests both require a current `expectedVersion`; a stale call is refused, and an unknown outcome is never retried.
- **Honest travel data.** Flights are generated for the next three days, rates are demo data, and the hotel takes requests only: the page says clearly that it has no live inventory and takes no payment.

## Accomplishments

- A visible, testable cross-origin consent gate with zero peer requests before approval.
- A two-agent caller network and a separate hotel network, both running in a normal browser tab.
- Per-origin private-context rules: only the natural-language request crosses the boundary.
- 13 unit tests, 16 browser checks, and GitHub Actions on every push.
- A complete spec map, demo script, screenshots, and a reproducible local setup with no server dependencies.

## What we learned

Consent has to live at the transport boundary. A sentence in the system prompt is not a control; the runtime must pause before the fetch and show the destination and payload. Treating peer networks as untrusted public data also keeps the key and the user's context on the caller's side.

## What's next

- Deploy the two sites to two public origins (the README has the exact changes) and record the live flow with Otari.
- Add a second peer with a different trust level to show per-origin policies.
- Add an optional MCP facade and an A2A card.
- Publish the Otari onboarding feedback and a browser quickstart.

## Built with

HTML, CSS, JavaScript, Node.js 22, Neuro SAN agent networks, Mozilla Otari, Playwright, GitHub Actions.

## Links

- Repository: <https://github.com/pham-canh/trip-relay>
- Demo video: `[ADD YOUTUBE LINK]`
- Otari account email: `[ADD OTARI ACCOUNT EMAIL]`

## Before submitting

- [ ] Record the under-two-minute narrated video and replace the link above.
- [ ] Add the Otari account email and check the problem/improvement text in `docs/OTARI.md`.
- [ ] Confirm the repository is public and the license is visible.
- [ ] Upload the repository social preview (`docs/social-preview.png`) and pin the repo if it belongs in the portfolio.
- [ ] Re-run `npm test` after any deployment URL change.

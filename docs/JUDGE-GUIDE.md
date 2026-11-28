# Judge guide — Trip Relay

A one-page path through the submission. The live pair is:

- Airline: <https://pham-canh.github.io/trip-relay/>
- Hotel: <https://pham-canh.github.io./> — the trailing dot is a second browser origin. Keep it.

## 60-second path

1. Open the airline page. Pick a flight, enter the demo passenger `Alex Nguyen` / `alex@example.com`, and book it. No payment, no real reservation.
2. Open **Ask Skyline** → **Try the scripted demo (no key)**.
3. Ask: “Can you ask Harbor Hotel whether it has a quiet room near the airport?”
4. The consent card appears before any hotel request. It names the hotel origin, the purpose, and the exact text that will cross.
5. Press **Decline**. The hotel is never contacted. Ask again and press **Allow**.
6. Open the **Receipt** tab. Verify the hash chain, inspect the events, download the redacted JSON, reload the page to restore it, then clear it.

The `⚠ MOCK LLM` badge stays visible in the keyless demo. That is intentional: the demo is a deterministic scripted endpoint, not a live model call.

## Why this needs agents, not just a booking site

The plain airline site can sell a flight. The plain hotel site can describe a room. Neither can answer the question a traveler actually has — “I land at 10:40; is there a quiet room near the airport?” — because the answer spans two independent businesses. A link loses the request; a hidden API call gives the traveler no say.

Trip Relay makes the handoff the product: the airline's assistant can ask the hotel's assistant, but the traveler sees the exact origin, purpose, and request before any byte crosses, and gets a receipt afterward. That is what the agent adds that the plain site cannot: delegation across a boundary the traveler can see and control.

## The two signals the challenge mentions

1. **The JSON that lists the connected network.** `site/agent-manifest.json` → `allowed_peers` names exactly `https://pham-canh.github.io.`. `site/skyline_air.network.json` lists the hotel's `harbor_hotel` network as a tool. The hotel's manifest lists no further peers.
2. **The consent card.** It appears before the first cross-origin fetch, not after. The browser check asserts **0** hotel requests before **Allow** and **0** after **Decline**.

## What is real, and what is scripted

**Real:** the two origins, the manifests and network files, the runtime, the consent gate, the peer fetch, the DLP checks, the receipt hash chain, IndexedDB persistence, the hosted deployment, and the browser checks.

**Scripted:** the model calls in the tests and in the keyless demo. They speak the same SSE/tool-call protocol as Otari, but no provider is contacted. The public manifests default to Otari. No live Otari call is claimed.

## Bring your own key

Trip Relay ships no provider token and does not pay for a visitor's inference. To use a real model, add your own Otari key in the assistant drawer's **Settings** tab. It stays in browser storage and is sent only to the selected router. The manifests publish Otari as the default, with global and EU presets. The keyless demo exists so you can judge the consent and receipt flow without spending tokens.

## Community tools

- `scripts/check_origins.mjs` — dependency-free check that a two-site pair is on distinct origins, both manifests load, the peer manifest is CORS-readable, and `allowed_peers` matches.
- `scripts/benchmark_dlp.mjs` — deterministic 12-attack / 4-control matrix against the real dispatch boundary, with a per-run canary.
- `scripts/browser_check.mjs` — 67-check Playwright pass; hosted variants run 13 consent/receipt checks and 10 keyless-demo checks.
- `PROTOCOL.md` — pattern, threat model, failure modes, limits.
- `docs/SPEC-MAPPING.md` — requirement-by-requirement map to MVP Profile 0.2.
- `docs/COMMUNITY.md` — what another team should copy, what to change, and what not to copy.

The pair is listed on the challenge's official [agentic websites list](https://github.com/cognizant-ai-labs/agentic-web/blob/main/docs/agentic_websites.md) (PR #85, merged). MIT licensed; the vendored runtime keeps Apache 2.0.

## Evidence

| Check | Result |
|---|---|
| Unit suite | 35/35 |
| DLP benchmark | 12/12 attacks blocked, 4/4 controls pass |
| Local browser pass | 67/67 |
| Hosted consent/receipt | 13/13 |
| Hosted keyless demo | 10/10 |
| Official `check_partner.mjs` | OK for both hosted directions |
| Console errors on hotel | 0 |

The detailed evidence is in [`docs/ORIGIN.md`](ORIGIN.md), [`docs/dlp-benchmark.json`](dlp-benchmark.json), and the README test table.

## Limits

- The receipt is per-tab and stored in IndexedDB; it is not a remote WORM store.
- Both sites are static and use generated inventory. No real booking, payment, or reservation.
- The hotel uses a trailing-dot host. Some corporate proxies reject it; the local pair (`127.0.0.1` vs `localhost`) is the fallback.
- No live Otari call is recorded. The keyless demo and the tests use a scripted endpoint.

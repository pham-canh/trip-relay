# Two origins, not two paths

The live pair is:

- **Airline:** <https://pham-canh.github.io/trip-relay/>
- **Hotel:** <https://pham-canh.github.io./>

The hotel URL ends with a dot. That dot is part of the host. Do not drop it.

## Why the dot matters

An origin is **scheme + host + port**. `https://pham-canh.github.io/trip-relay/` and `https://pham-canh.github.io/` share the origin `https://pham-canh.github.io`; a path is not an origin boundary. The hotel uses `pham-canh.github.io.` (trailing dot), which serializes to the distinct origin `https://pham-canh.github.io.`. Browsers keep the dot in `location.origin` and treat the two hosts as different origins for the same-origin policy, `localStorage`, and CORS.

## Evidence

Recorded on 2026-11-24 in Chrome on macOS, against the live pair; the consent and receipt flow was re-run on 2026-11-25 after the DLP deploy:

| Check | Airline | Hotel |
| --- | --- | --- |
| `location.origin` | `https://pham-canh.github.io` | `https://pham-canh.github.io.` |
| `localStorage` probe | `airline` | `hotel`; the airline's value is still `airline` |
| Manifest fetch from the airline | — | HTTP 200, `Harbor Hotel Assistant` |
| CORS header on the hotel manifest | — | `access-control-allow-origin: *` |

The hosted consent flow, in the same browser:

- The consent card names `pham-canh.github.io.`.
- **0** requests reach the hotel before **Allow**.
- **0** requests reach the hotel after **Decline**.
- **11** requests reach the hotel after **Allow**, followed by the hotel answer.
- The Privacy receipt records the consent, the peer fetch, and the decline; its hash chain verifies in the page.
- No console errors.

The hosted run used a scripted OpenAI-compatible endpoint injected for the test. The deployed manifest declares `mock: false`, so the badge correctly flags the scripted peer response as a routing error. With a real Otari key the badge shows the real model. The demo recording uses the local manifest with `mock: true`, where the badge says `MOCK LLM — no real model` throughout. Neither is a live Otari call; see [OTARI.md](OTARI.md).

## Reproduce it

Deployment check, no key and no browser:

```bash
npm run check:origins
```

The same check runs as a manual GitHub Actions workflow. The first live run passed on 2026-11-24: <https://github.com/pham-canh/trip-relay/actions/runs/45318205435>.

Local pair:

```bash
npm run serve:airline
npm run serve:hotel
AIRLINE_URL=http://127.0.0.1:8080/ PEER_URL=http://localhost:8081/ npm run check:origins
```

Browser check, repeatable with a scripted endpoint and no key:

```bash
npm install
npm run check:browser:live
```

Expected: 12/12 checks pass. The same checks run locally with `npm run check:browser` (27/27) after `npm run serve:airline` and `npm run serve:hotel`.

Manual origin check:

1. Open the airline URL and run `location.origin` in DevTools. It is `https://pham-canh.github.io`.
2. Open the hotel URL and run `location.origin`. It is `https://pham-canh.github.io.`.
3. On the airline page, `await fetch("https://pham-canh.github.io./agent-manifest.json").then((r) => r.json())` returns the Harbor Hotel manifest.
4. On the airline page, `localStorage.setItem("probe", "airline")`; on the hotel page, `localStorage.getItem("probe")` is `null`.

## What this proves, and what it does not

**Proves:** the browser enforces an origin boundary between the two sites; the hotel's public artifacts are CORS-readable from the airline; the consent gate precedes the first peer request.

**Does not prove:** server isolation or publisher identity. Both sites are public static files and the hotel holds no private data. The private state is the airline's chat/page state and the visitor's key, which stay on the airline origin and are never sent to the hotel. There is no cryptographic attestation and no remote audit store; the runtime's audit log is a session hash chain, not a server-side WORM log. See [PROTOCOL.md](../PROTOCOL.md) and [ROADMAP-DLP.md](ROADMAP-DLP.md).

**Caveat:** some corporate proxies and VPNs reject trailing-dot hosts. The local pair (`127.0.0.1` vs `localhost`) is the fallback, and a custom domain is the cleaner long-term deployment. The app only needs `PEER_URL` changed and a rebuild.

## Why not just a path?

`https://pham-canh.github.io/trip-relay/` and `https://pham-canh.github.io/hotel/` would share an origin. The airline could read the hotel's `localStorage` and the browser would not enforce CORS between them; the consent card would be the only boundary. That is exactly the weakness Trip Relay is meant to expose. The path form is not used for the hotel.

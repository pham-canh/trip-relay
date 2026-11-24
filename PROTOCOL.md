# Consent-gated agent handoff

Trip Relay is a reference implementation of a small interaction pattern: **one agent site asks another, on the visitor's behalf, and the browser pauses at the origin boundary before any request leaves the page.**

This document describes the pattern as implemented here. It is not a new standard and does not claim to replace the [MVP Profile 0.2](https://github.com/cognizant-ai-labs/agentic-web/blob/main/docs/worldwide_agentic_web_mvp_spec.md). It is the part of the entry that should outlive the travel demo.

## Why the boundary needs a protocol

A prompt can say "ask the hotel," but a prompt is not a control. The browser has to answer four questions before the first peer fetch:

1. **Which origin** will be contacted?
2. **Which published network** is being requested?
3. **What request text** is leaving the page?
4. **Who approved it**, and how long does that approval last?

If the runtime fetches the peer manifest first to render a nicer card, the consent decision is already too late. Trip Relay therefore treats the card as part of the transport path, not as a chat decoration.

## Actors and artifacts

| Actor | Role in this demo |
| --- | --- |
| Visitor | Chooses the caller site, supplies the model key, approves or declines the handoff |
| Caller site | Skyline Air at `http://127.0.0.1:8080` locally, or <https://pham-canh.github.io/trip-relay/> hosted; owns the page, actions, and current context |
| Peer site | Harbor Hotel at `http://localhost:8081` locally, or <https://pham-canh.github.io./> hosted; publishes static agent artifacts |
| Browser runtime | Loads both networks, enforces policy, renders consent, runs the peer locally |
| LLM router | Otari or another OpenAI-compatible endpoint; receives the visitor's key, never the peer site |
| Model | Decides which tool to call; does **not** decide whether the origin boundary may be crossed |

The caller publishes:

- `agent-manifest.json`: brand, network names, front agent, resolved network URL, default router, peer policy, allowed origins, site actions.
- A resolved network JSON (or HOCON): data-only agent graph with instructions and schemas.
- `links.json`: publisher-owned peer link map.
- Site actions: same-origin capabilities registered with the runtime.

The peer publishes the same public artifacts. Its network is **data**, not a remote process.

## Handoff sequence

```
Visitor            Caller runtime                 Peer origin
   |                     |                              |
   |  ask a question     |                              |
   |-------------------->|                              |
   |                     | model chooses peer tool      |
   |                     | validate against policy      |
   |                     | (no fetch yet)               |
   |<--------------------| consent card: origin,        |
   |                     | network, request text        |
   |  decline            |                              |
   |-------------------->| stop; no manifest fetch      |
   |                     |                              |
   |  allow              |                              |
   |-------------------->| fetch agent-manifest.json    |
   |                     |----------------------------->|
   |                     |<-----------------------------|
   |                     | exact network match only     |
   |                     | fetch network JSON           |
   |                     |----------------------------->|
   |                     |<-----------------------------|
   |                     | validate + run locally       |
   |                     | return one tool result       |
   |<--------------------|                              |
```

### 1. Reference resolution

The agent references a peer with an exact URL whose final path is the published network name, for example `http://localhost:8081/harbor_hotel` locally or `https://pham-canh.github.io./harbor_hotel` hosted. The runtime strips the final path to get the peer base and treats the final segment as the requested network. There is no fallback to `networks[0]`; a missing exact name fails closed.

### 2. Policy gate

Before consent, the caller checks the peer origin against the caller manifest's `allowed_peers` and `peer_policy.mode`. A denied origin never reaches the consent UI. The check is per hop, because a composed network may attempt a second peer.

### 3. Consent gate

The runtime pauses the tool call and asks the visitor to allow the contact. The card includes:

- the peer host (`localhost:8081`) and human-readable label,
- the exact natural-language request, which conveys the purpose,
- an optional token/cost estimate.

**Allow** permits this contact. **Decline** returns a tool result saying the user declined; the model must continue without the peer. The runtime also offers **Always allow** for the current page session, scoped to that origin. The default is per-contact.

No peer request occurs while the card is open. This is the invariant the Playwright pass asserts.

### 4. Exact artifact fetch

After approval, the runtime fetches the peer's `agent-manifest.json`, selects the entry whose `name` exactly matches the requested network, and fetches that entry's network definition. It does not discover the peer's other networks; actions are discovered only after this approval.

The peer's public files are CORS-enabled. The visitor's key is **not** sent to the peer origin; the key goes only to the configured router.

### 5. Local execution

The peer network runs in the caller's browser with the caller's router, model policy, and execution budget. The runtime does not forward a server-side session, the caller's chat history, the caller's page state, the airline passenger record (name and email), or the API key.

Only the declared request text crosses the boundary; the consent card shows it before the fetch. Private context is deny-by-default; a network must explicitly permit fields to pass. In this demo, the hotel receives only the `request` string. If the hotel's own write action is invoked, its arguments go to the hotel origin through the action bridge and are confirmed there, not silently forwarded from the caller's page state.

### 6. Result return

The peer front agent's answer returns through the caller's normal tool-result path. The caller's model sees a result, not a privileged execution channel. The runtime records the origin, policy decision, fetched URLs, and outcome in the trace.

## Write safety

The handoff is read-mostly by design. Writes stay on the owning site:

- `book_flight` and `request_room` are site actions owned by the airline and hotel, not capabilities the caller can run silently.
- Each write requires a visitor confirmation dialog named after the action. A peer action opens the owning origin's bridge, so the confirmation happens there.
- Each write requires `expectedVersion`; a stale version is refused with a readable reason.
- An unknown outcome after a write begins is reported as unknown and is not retried independently by the runtime.

A peer can describe a room or a policy; it cannot silently book or charge anything on the caller's page.

## Failure modes

| Condition | Behavior |
| --- | --- |
| Origin not in `allowed_peers` | Refuse before consent; trace the policy denial |
| Visitor declines | Return "user declined"; no peer fetch |
| Manifest missing or malformed | Fail closed; no partial network execution |
| Exact network name missing | Refuse; do not substitute another network |
| Network fails validation | Refuse before a model call |
| Peer asks for undeclared context | Runtime does not supply it |
| Budget or depth exceeded | Stop composition; report the limit |
| Stale write version | Refuse and return the current version |
| No model key | Keep manual pages usable; do not invent an answer |

## What is deliberately not implemented

These are honest boundaries, not hidden claims:

- **No cryptographic attestation.** The demo verifies published names and origins, not signatures or publisher identity.
- **No server-side policy enforcement.** The consent gate lives in the browser runtime. A production system should mirror the policy at a trusted gateway.
- **No persistent audit log.** The trace is visible in the page but is not exported to a tamper-evident store.
- **No real inventory, payment, or booking.** Travel data is generated demo data.
- **No general-purpose authenticated action API beyond the shipped bridge.** The runtime can call a peer's declared actions through its action bridge; this demo uses that for the hotel's own actions, and writes still require confirmation on the owning origin. A production system would add authorization and audit controls around that bridge.

## Testable invariants

The repository tests these directly:

1. Zero requests to the peer origin (`localhost:8081` locally; `pham-canh.github.io.` hosted) before **Allow**.
2. The consent card names the peer and the request.
3. After **Allow**, the runtime fetches only the exact `harbor_hotel` network.
4. The peer receives the request text, not the caller's history or key.
5. The peer policy is closed; an unlisted origin fails closed.
6. A declined write changes no state.
7. A stale write is refused.
8. Both sites keep working without a model key for manual use.

See `npm test`, the Playwright checks in `docs/DEMO.md`, and the requirement map in `docs/SPEC-MAPPING.md`.

## How this could become a product

The reusable unit is not the airline page. It is the policy-and-consent boundary plus the trace:

- a small browser/runtime library that renders the consent card and enforces per-origin policy,
- a publisher SDK that emits the manifest/network/link artifacts,
- an optional server-side gateway for rate limits, budgets, audit logs, and signed publisher identity,
- a per-origin policy console for businesses that want to allow, deny, or narrow agent access.

That is the B2B path. The consumer path is narrower: one real travel use case with live inventory, affiliate terms, privacy policy, and a server-side model key. Both are separate from the hackathon demo and should not delay it.

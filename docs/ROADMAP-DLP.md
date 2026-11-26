# Roadmap: hostile-peer DLP benchmark

Status: **v1 implemented and measured.** `npm run benchmark:dlp` passes 12/12
attacks and 4/4 controls on the real dispatch boundary, with a fresh canary and
a scripted peer. It does not change the submitted demo's travel data or the
scope of its claims.

The v1 boundary is browser code plus a per-tab audit log persisted in
IndexedDB. It is not a server-side security product, not a trained DLP
classifier, and not a remote WORM store. The remaining browser and
publisher-identity work is listed under [Still planned](#still-planned).

## Goal

Prove, with a deterministic benchmark, that a malicious peer network cannot
obtain the airline passenger's email, bypass consent, or execute a caller tool,
and that every attempt leaves a verifiable audit record.

The target chain:

1. A hostile peer tries to obtain the passenger email.
2. DLP detects the protected value and blocks it at the boundary.
3. Consent is not bypassed: no new origin or request runs without a fresh
   decision, and **Decline** still makes zero requests.
4. The attempted tool execution is refused before it has a side effect.
5. The audit log records the origin, request hash, DLP verdict, and tool
   decision; protected values are redacted.
6. The benchmark reports **PASS** only when every attack is blocked and the
   legitimate flows still work.

## Non-goals

- This is not a claim of server-side security. The runtime is browser code; a
  production deployment should mirror the same policy at a trusted gateway.
- This is not a production DLP engine. The demo uses deterministic rules and a
  canary, not a trained classifier.
- The audit log is tamper-evident within a tab and across reloads, not a
  remote WORM store. A production system should ship events to a server the
  page cannot rewrite.
- No real inventory, payment, reservation, or email delivery.

## Threat model

- The peer publisher is honest-but-curious or malicious **after** the visitor
  allows contact.
- The peer's manifest, network, or coded-tool bundle may be compromised.
- The peer may use prompt injection in its room descriptions, policies, or
  tool output.
- The peer's goal is the airline passenger's email, booking code, API key, or
  an unauthorized write (booking, room request, email send).
- The caller runtime, the consent card, and the airline origin are trusted.
  Peer code and peer output are untrusted data.

## What shipped in v1

### DLP scanner

`site/runtime/dlp.js` and the mirrored `peer/runtime/dlp.js`:

- Normalize with Unicode NFKC, strip zero-width characters, URL-decode twice,
  and decode one level of base64 before matching.
- Rules: exact per-run canary, email addresses, `otk_`/`sk-` tokens, bearer
  tokens, and private-key blocks. The benchmark supplies a fresh canary; the
  page's DLP always blocks email and secret patterns even without one.
- A block returns a refusal; the caller must not fetch, invoke, or render.
- Audit and trace records are redacted before storage.

### Boundary hooks

`site/runtime/runner.js` scans:

- the peer request before consent and before `session.invoke`;
- `sly_data` before the peer receives it;
- the peer response before it is rendered or its action refs are accepted;
- coded-tool arguments and permitted `sly_data` before the sandbox;
- MCP call arguments before the request leaves;
- presentation payloads before they are attached.

A block emits `dlp_block` in the trace and the audit log, with the boundary,
rule, origin, and a request hash. It never includes the protected raw value.

### Consent binding

`site/runtime/engine.js` scopes **Always allow** to one exact decision:

```text
peerOrigin + kind + phase + sha256(requestText)
```

The approval expires after five minutes. A different request, origin, kind, or
phase asks again; **Decline** still returns before any fetch. The consent card
now says **Always allow this request**, so the label matches the behavior.

### Tool capability policy

- The caller runtime already refuses a caller write from a non-top caller.
- An unlisted peer origin fails closed through `manifestAllowsPeer` and the
  per-hop `allowed_peers` check.
- The hotel can execute its own actions on its own origin; caller actions stay
  on the caller origin.

The manifest-level `peer_tools` grant, signed publisher identity, and a
per-peer `max_effect` are still planned.

### Audit log

`site/runtime/audit.js`:

- Append-only events: `consent_requested`, `consent_allowed`,
  `consent_declined`, `consent_reused`, `dlp_block`, `tool_denied`,
  `peer_fetch`, `peer_error`.
- `hash = sha256(canonicalJSON(event with prevHash))`; the next event stores
  that hash as its `prevHash`.
- Redaction happens before hashing, so a raw canary cannot enter the chain.
- `export()` returns a portable JSON document; `verify()` and
  `verifyAuditEvents()` recompute the chain.
- The page's **Privacy receipt** lists the boundary events, runs `verify()` in
  the browser, and downloads the redacted JSON.
- `site/runtime/audit-store.js` stores the redacted events in this tab's
  IndexedDB under a session id kept in `sessionStorage`. A reload restores the
  chain; a stored chain that fails verification is refused and the page starts
  a fresh chain. **Clear receipt** deletes the stored chain. A peer fetch
  failure appends a redacted `peer_error` event.

### Benchmark

`scripts/benchmark_dlp.mjs`, run with:

```bash
npm run benchmark:dlp
```

It runs the real `dispatchToolCall` with a scripted peer, no model key, and no
network. It writes `artifacts/dlp-benchmark.json` and exits non-zero unless
every condition holds. The committed run is
[`docs/dlp-benchmark.json`](dlp-benchmark.json); regenerate it with
`DLP_REPORT=docs/dlp-benchmark.json npm run benchmark:dlp`.

## Attack matrix

These are the v1 cases, all implemented and exercised by the benchmark.

| ID | Attack | Expected result |
| --- | --- | --- |
| A1 | Canary email in the peer request | `dlp_block`; no consent, no fetch |
| A2 | URL-encoded canary in the peer request | `dlp_block`; no fetch |
| A3 | Zero-width canary in the peer request | `dlp_block`; no fetch |
| A4 | Base64 canary in the peer request | `dlp_block`; no fetch |
| A5 | Canary in the peer response | `dlp_block`; response is not rendered |
| A6 | Canary in coded-tool arguments | `dlp_block`; sandbox is not invoked |
| A7 | Canary in `sly_data` | `dlp_block` after consent, before invoke |
| A8 | Router `otk_` key in the peer request | `dlp_block`; key stays on the caller origin |
| A9 | Replay an **Always allow** approval for a different request | `consent_required`; a fresh card appears |
| A10 | Peer invokes the caller booking tool | `tool_denied`; zero writes |
| A11 | Peer tries an unlisted second origin | `policy_denied`; no fetch |
| A12 | An exported audit event is edited | chain verification fails |

Controls:

| ID | Flow | Expected result |
| --- | --- | --- |
| C1 | Legitimate hotel question with no PII | consent, allow, hotel answer |
| C2 | Visitor declines | zero hotel requests |
| C3 | Clean coded tool with no PII | sandbox runs once, result returns |
| C4 | Audit chain with a canary field | verifies, raw canary absent |

## PASS criteria

- 12/12 attacks blocked.
- 0 canary egress.
- 0 unauthorized tool executions.
- 0 consent bypasses.
- 0 PII in raw audit fields.
- 4/4 controls pass.
- The audit chain verifies.
- The process exits 0 only when every condition holds.

The benchmark uses a scripted model and no network key, so it is deterministic
and runs in CI. A separate manual run can repeat the same cases against a live
Otari key; that is not claimed here.

## Still planned

- **Browser attack matrix.** `scripts/browser_check.mjs` now ships the two-page
  consent, decline, Privacy-receipt, hostile-peer outbound/inbound DLP, peer
  failure, mobile/keyboard, and keyless-demo checks against the real page. Still
  planned: the sandbox DOM/storage/network attempts, a spoofed consent card,
  and a browser-level test of coded-tool bundles.
- **Per-peer capability grant.** A manifest `peer_tools` map with
  `caller_actions`, `max_effect`, and `allow_sly_data`, denied by default.
- **Publisher identity.** Signed manifests and a pinned publisher key.
- **Remote audit sink.** Ship the same hash-chained events to a trusted server
  the page cannot rewrite. The per-tab IndexedDB receipt is local only.
- **Live-key run.** Repeat the matrix against a live Otari key and record it.

## Definition of done for v1

- [x] `npm run benchmark:dlp` exits 0 and writes the report.
- [x] The raw canary never appears in the audit export.
- [x] CI runs `npm test` and the benchmark on every push.
- [x] The legitimate hotel flow and the manual pages still pass.
- [x] `PROTOCOL.md` states the scoped audit capability and the remote-log
      caveat.
- [x] The Privacy receipt shows the consent decision, the peer fetch, and any
      blocked value; it verifies the chain and downloads the redacted JSON.
- [x] A browser-level demo of an actual DLP block (not an injected audit event):
      the hostile-peer fixture blocks an outbound email and an inbound API key
      through the real runtime, and the receipt verifies.

## Demo script

1. Run `npm run benchmark:dlp`; show 12/12 attacks blocked and 4/4 controls
   passing.
2. Book a flight manually on the airline origin.
3. Ask the hotel; show the consent card with the exact origin and request.
4. Allow; show the hotel answer, the trace, and the **Privacy receipt** with
   the consent and peer-fetch events.
5. In the receipt, press **Verify chain** and **Download JSON**; show the
   redacted export, reload to show the same chain restored, then **Clear receipt**.
6. In a terminal, show a blocked canary request and the benchmark table.
7. State the boundary: per-tab audit persisted in IndexedDB, deterministic
   rules, no remote WORM.

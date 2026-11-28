# Reuse the boundary

Trip Relay is a reference implementation, not a library. This page is the shortest path for another team that wants the same consent-gated handoff between two sites.

## What is worth copying

1. **Consent before the first peer fetch.** The runtime pauses before it requests the peer's manifest, shows the exact origin, purpose, and request text, and fetches nothing on page load. A prompt sentence is not a control.
2. **A closed peer policy.** The caller's manifest lists exactly the peer origins it may contact; the peer lists no further peers. An unlisted origin fails closed.
3. **Private context by exception.** Only the declared natural-language request crosses. Chat history, page state, passenger records, and the API key stay on the caller's origin.
4. **DLP at every egress.** Check the outbound request, coded-tool arguments, `sly_data`, and the peer's response. Block canaries, emails, keys, and bearer tokens before they leave or render.
5. **A receipt the visitor can inspect.** Hash-chain the consent decisions, peer fetches, failures, and blocked values; verify in the page; export redacted JSON; persist per tab; refuse a tampered store.
6. **Tests that assert the ordering.** The important test is not “the answer appeared”; it is “zero requests before Allow, zero after Decline, and the peer answer after Allow.”

## What to change

- **Origins.** Use two real origins. Locally, `127.0.0.1` and `localhost` are different origins; two ports on one hostname are not. On a static host, a second hostname or a trailing-dot host works, but a custom domain is cleaner.
- **`allowed_peers`.** Put the peer origin in the caller's `agent-manifest.json`; put no peers in the peer's manifest unless it really calls another site.
- **Network URL.** Point the caller's partner tool at the peer's exact published network, such as `https://peer.example/harbor_hotel`. Do not fall back to a different network when the name is missing. Do **not** use a `link_slots` entry for a partner: the spec's linking guide warns that an unbound slot makes the chat ask the visitor for a URL and allows that origin for the whole page. Leave `links.json` empty for a direct partner; the connection is declared in `tools` and `allowed_peers`.
- **`link_labels`.** Give the consent card a human label for that URL.
- **CORS.** The peer's public artifacts need `Access-Control-Allow-Origin` for the caller. GitHub Pages sends `*`; a custom server must do the same.
- **Build-time rewrite.** If the same source runs locally and hosted, rewrite the local URLs at build time, as `scripts/build_public.mjs` does, and fail the build when both sites resolve to one origin.

## Tools in this repository

```bash
npm run check:origins      # distinct origins, manifests, CORS, allowed_peers
npm run benchmark:dlp      # 12 hostile-peer attacks + 4 controls
npm run check:browser      # 67 local checks; needs Chrome and the local pair
npm run check:browser:live # 13 consent/receipt checks against a deployed pair
npm run check:browser:demo # 10 keyless-demo checks against a deployed pair
```

- [`scripts/check_origins.mjs`](../scripts/check_origins.mjs) is dependency-free and takes `AIRLINE_URL` and `PEER_URL`.
- [`scripts/benchmark_dlp.mjs`](../scripts/benchmark_dlp.mjs) runs against the real dispatch boundary with a per-run canary.
- [`scripts/browser_check.mjs`](../scripts/browser_check.mjs) is the Playwright harness; the hosted variants are flags on the same file.
- [`PROTOCOL.md`](../PROTOCOL.md) explains the pattern, failure modes, and limits.

## What not to copy

- The travel inventory, prices, and fictional brands.
- The trailing-dot host as a long-term deployment. It is a workaround for a single static host; a custom domain is clearer and avoids proxies that reject trailing-dot hosts.
- The per-tab receipt as a production audit store. It is tamper-evident within the tab, not a remote WORM log.
- Any claim of a live model call when the demo uses a scripted endpoint. Label the mock.

## Contributing back

If you reuse the pattern, open an issue or a PR with the origin pair and the checks you ran. The challenge's own list is [`agentic_websites.md`](https://github.com/cognizant-ai-labs/agentic-web/blob/main/docs/agentic_websites.md); Trip Relay was added in [PR #85](https://github.com/cognizant-ai-labs/agentic-web/pull/85).

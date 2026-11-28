# Otari integration notes

Trip Relay is built on Mozilla's [Otari](https://github.com/mozilla-ai/otari) LLM router. Both manifests publish the global hosted endpoint as the default:

```json
"llm_router": {
  "base_url": "https://api.otari.ai/api/v1",
  "mock": false,
  "byok_router": "https://api.otari.ai/api/v1"
}
```

The network model is `alibaba/qwen-3.5-35b-a3b`. Otari issues two key regions:

| Key prefix | Router |
| --- | --- |
| `otk_...` (new keys) or `tk-...` (older keys) | `https://api.otari.ai/api/v1` |
| `otk_v1_eu_...` | `https://eu.api.otari.ai/api/v1` |

The settings panel adds **Otari (Mozilla)** and **Otari (Mozilla, EU)** presets. The EU preset is selected automatically for `otk_v1_eu_` keys; the two prefixes are matched longest-first so the region-specific prefix wins. Keys are stored only in the visitor's browser and sent only to the selected router as a bearer token; no key is committed to this repository, and the hotel origin never receives it.

The presets are a small, deliberate addition to the vendored settings UI (`site/runtime/ui.js` and `peer/runtime/ui.js`); the rest of the Apache-2.0 runtime is unchanged. If you re-copy the runtime from the Agentify skill, re-add the presets or enter the router and model manually.

## What worked

- The OpenAI-compatible `/chat/completions` contract is all the demo needs. The runtime streams SSE, including tool-call deltas, and Otari's shape matches it without an adapter.
- Keeping `llm_router` metadata in the manifest makes the default router visible to a judge without reading the runtime.
- The hotel network is compiled with the caller's active router, so the second origin is public data only: no key, no credentials, no server-side session.
- A key sent to the wrong region fails predictably with HTTP 421 and an error naming the correct host. That made the regional bug visible instead of producing a generic authentication failure.

## Devpost Otari field

Devpost asks for three things when a project uses Otari. Fill in the first before submitting:

- **Otari account email:** `crytobot459@gmail.com`
- **Problem faced:** The quickstart assumes Python 3.13 and uv 0.13 or newer. My machine has Python 3.12.4 and uv 0.12.15, and Docker was not running, so the documented local gateway path was blocked. I used the hosted base URL instead and built against the documented contract. The second friction point was region selection: an EU key sent to `api.otari.ai` returns HTTP 421 (`This API key belongs to eu.api.otari.ai. Send the request there instead.`), but the key format and the regional endpoint are easy to miss when the only visible setup field is a generic provider URL. The third was browser CORS: a static agent site cannot call the router from a page until `cors_inference_origins` is configured, and that setting is separate from the general CORS setting.
- **Improvement:** Add a copy-paste browser quickstart with a pinned `uvx` or Compose service and a preflight check for the Python/uv versions; show both regional endpoints next to the key prefix; and add a short "calling Otari from a browser page" section with the exact `cors_inference_origins` config and the warning not to combine it with credentials. I would also relax or clearly document the uv version window so a machine with a slightly older uv fails with a fix, not a resolver error.

## Verification status

The 35 unit tests, the 67-check local browser pass (plus 13 hosted checks), and the 12-attack/4-control DLP benchmark use a scripted model that speaks the same SSE/tool-call protocol, so they prove the integration boundary, the consent flow, the hostile-peer policy, the receipt, and the regional-router selection without spending tokens. A keyless page can also run the read-only `browser://mock` demo; it calls no provider. A live Otari call needs the account email above and an Otari key; after adding the key, use the assistant drawer's **Settings -> Otari (Mozilla)** for a global key or **Otari (Mozilla, EU)** for an EU key, then ask *"Can you ask Harbor Hotel whether it has a quiet room near the airport for two nights?"*.

Treat any key shared in a screenshot, chat, or issue as compromised and revoke it. The repository contains no Otari key.

## CORS note for a deployment

The local demo serves both sites from loopback, where the runtime fetches the hotel's public JSON with CORS allowed by `scripts/serve.mjs`. The hosted pair runs on GitHub Pages, which sends `Access-Control-Allow-Origin: *` for the public files. Otari itself must also allow the two browser origins that call the router; enable only the inference origins Otari documents (`cors_inference_origins`) and do not enable credentialed CORS. The page sends the key in the `Authorization` header, not in a URL or cookie. On 2026-11-24 a preflight from `https://pham-canh.github.io`, `https://pham-canh.github.io.`, `http://localhost:8081`, and `http://127.0.0.1:8080` returned `access-control-allow-origin: *` with `authorization,content-type` allowed.

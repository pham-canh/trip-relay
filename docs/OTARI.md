# Otari integration notes

Care Relay is built on Mozilla's [Otari](https://github.com/mozilla-ai/otari) LLM router. Both manifests use the hosted endpoint:

```json
"llm_router": {
  "base_url": "https://api.otari.ai/api/v1",
  "mock": false,
  "byok_router": "https://api.otari.ai/api/v1"
}
```

The network model is `alibaba/qwen-3.5-35b-a3b`. The settings panel adds an **Otari (Mozilla)** preset that fills the router, model, and the `tk-` key hint. Keys are stored only in the visitor's browser and sent only to the selected router as a bearer token; no key is committed to this repository, and the peer origin never receives it.

## What worked

- The OpenAI-compatible `/chat/completions` contract is all the demo needs. The runtime streams SSE, including tool-call deltas, and Otari's shape matches it without an adapter.
- Keeping `llm_router` metadata in the manifest makes the default router visible to a judge without reading the runtime.
- The peer network is compiled with the caller's active router, so the second origin is public data only: no key, no credentials, no server-side session.

## Devpost Otari field

Devpost asks for three things when a project uses Otari. Fill in the first before submitting:

- **Otari account email:** `[ADD YOUR OTARI ACCOUNT EMAIL BEFORE SUBMITTING]`
- **Problem faced:** The quickstart assumes Python 3.13 and uv 0.13 or newer. My machine has Python 3.12.4 and uv 0.12.15, and Docker was not running, so the documented local gateway path was blocked. I used the hosted `https://api.otari.ai/api/v1` base instead and built against the documented contract. The second friction point was browser CORS: a static agent site cannot call the router from a page until `cors_inference_origins` is configured, and that setting is easy to miss because it is separate from the general CORS setting and sits below the main quickstart.
- **Improvement:** Add a copy-paste browser quickstart with a pinned `uvx` or Compose service and a preflight check for the Python/uv versions, plus a short "calling Otari from a browser page" section that shows the exact `cors_inference_origins` config and the warning not to combine it with credentials. I would also relax or clearly document the uv version window so a machine with a slightly older uv fails with a fix, not a resolver error.

## Verification status

The 13 unit tests and the 16-check browser pass use a scripted model that speaks the same SSE/tool-call protocol, so they prove the integration boundary and the consent flow without spending tokens. A live Otari call needs the account email above and an Otari key; after adding the key, use **AI model settings -> Otari (Mozilla) -> Save and start** and ask *"Can you ask Linden Pharmacy whether they deliver?"*.

## CORS note for a deployment

The demo serves both sites from loopback, where the runtime fetches the peer's public JSON with CORS allowed by `scripts/serve.mjs`. For a hosted Otari deployment that calls the router directly from the browser, enable only the inference origins Otari documents (`cors_inference_origins`) and do not enable credentialed CORS. The page sends the key in the `Authorization` header, not in a URL or cookie.

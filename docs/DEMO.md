# Demo script and recording checklist

## Recorded take

- Timing cut: [`docs/trip-relay-demo.mp4`](trip-relay-demo.mp4) — 1:45, 1600×900, 30 fps, H.264/AAC, synthetic narration, demo only.
- Entrant-voice cut: [`docs/trip-relay-demo-own-voice.mp4`](trip-relay-demo-own-voice.mp4) — same picture, Vietnamese narration by the entrant, 1:45.5, English subtitles burned into the picture, submission video. Published at <https://youtu.be/lDLhXmqXv6I>.
- Silent cut: [`docs/trip-relay-demo-silent.mp4`](trip-relay-demo-silent.mp4) — same picture, no audio, for recording your own narration.
- Thumbnail: [`docs/youtube-thumbnail.png`](youtube-thumbnail.png) — 1280×720.
- Caption sources: [`docs/trip-relay-demo-vi.srt`](trip-relay-demo-vi.srt) (Vietnamese) and [`docs/trip-relay-demo.srt`](trip-relay-demo.srt) (English, burned into the picture), retimed to the entrant-voice cut.
- The screen recording is the real local pair: the airline at `127.0.0.1:8084` and the hotel at `localhost:8081`. The airline copy used for the take publishes a **scripted OpenAI-compatible endpoint** as its mock router, so the assistant header shows `⚠ MOCK LLM — no real model` for the whole run. The public pair is unchanged and still uses Otari. The narration says this out loud.
- The timing cut uses macOS `say` (Samantha) for timing. The submission cut replaces it with the entrant's Vietnamese take; the English script below documents the demo, and the Vietnamese script is in [`docs/DUB-VI.md`](DUB-VI.md).

The recording proves the protocol and the boundary without spending tokens. It does **not** claim a live Otari call. A live Otari run is a separate take: add an `otk_...` key in **AI model settings** and repeat the same steps.

The recorded take predates the receipt persistence, the keyless demo, and the hostile-peer browser checks. Its narration says “fourteen tests”; the current repository has **35** unit tests and **66** local browser checks. Treat the video's count as historical, not as the current claim. The updated two-minute script at the end of this file is for an optional re-record.

## Before recording

The public pair is live at <https://pham-canh.github.io/trip-relay/> with the hotel at <https://pham-canh.github.io./>. The local pair gives you a cleaner consent card (`localhost:8081`) and more control.

1. Start the two sites:
   ```bash
   npm run serve:airline
   npm run serve:hotel
   ```
2. Open <http://127.0.0.1:8080/> and add a working key in **AI model settings**. Prefer the **Otari (Mozilla)** preset for a global `otk_...` key, or **Otari (Mozilla, EU)** for an `otk_v1_eu_...` key. The model must support tool calls. If Otari answers HTTP 421, the key belongs to the other region: switch to the EU preset and `https://eu.api.otari.ai/api/v1`.
3. Rehearse the cross-site question once, then press **Reset demo data** so the recording starts clean.
4. Close personal tabs, notifications, and any window that shows an API key.

For the scripted take, the airline copy at `127.0.0.1:8084` sets `llm_router.mock` to `true` and `base_url` to `http://127.0.0.1:8082/v1` in its `agent-manifest.json`. The public manifest is not changed.

## Recorded script (1:45)

| Time | On screen | Narration |
| --- | --- | --- |
| 0:00–0:08 | Skyline Air hero | "Two travel websites. Two separate origins. One assistant that can cross between them, but only with your permission." |
| 0:08–0:24 | Pick a flight, enter a passenger, book it, show the receipt | "Start on Skyline Air. Pick a flight, enter a passenger, and book it. The page holds the state, issues the reference, and never leaves the browser." |
| 0:24–0:48 | Ask for the hotel; consent card appears; hover the origin, request, and Allow | "Now ask the concierge about a hotel. The model wants to call Harbor Hotel, a different origin published by a different site. This take uses a scripted model endpoint, so the handoff is reproducible. The same page runs Otari with a key. Before anything leaves the page, you see who will be contacted, why, and the exact request." |
| 0:48–0:57 | Press **Decline**; show the card's Declined state and the assistant's reply | "Decline. The runtime stops the call. Zero requests reach the hotel, and the assistant tells you so." |
| 0:57–1:23 | Ask again, press **Allow**, show the answer and the Harbor Hotel inspector | "Ask again, and allow. The runtime fetches the hotel's published manifest, checks its policy, and runs its network. Harbor Hotel receives the request, not your chat history, and not your model key." |
| 1:23–1:33 | `npm test` summary and the five-step handoff | "The trace shows every hop. Origin, peer, consent, and result. Fourteen tests cover the runtime and the boundary." |
| 1:33–1:45 | Closing card | "Trip Relay. Two sites, one visible boundary. Live on GitHub Pages. MIT licensed. Built on the MVP Profile, with Mozilla Otari as the default router." |

The take ends at 1:45, under the two-minute limit. The last card also carries the recording disclosure: *"This recording uses a scripted OpenAI-compatible endpoint. The same page accepts Otari or any compatible router."*

## What the take shows

1. Nine flights render for the next three days.
2. Selecting the second flight updates the selection.
3. Manual booking returns a `SKY-` reference.
4. The consent card names Harbor Hotel, `localhost:8081`, the purpose, the exact request, and the estimated tokens.
5. **Zero** hotel requests occur before **Allow**.
6. **Decline** leaves the count at zero and the assistant says the hotel was not contacted.
7. **Allow** fetches the hotel manifest and network, then returns the hotel answer. The run makes 11 requests to the hotel origin.
8. The Harbor Hotel inspector shows the peer call and reply for the session.
9. The assistant run has no console errors.
10. The badge says `⚠ MOCK LLM — no real model` throughout, matching the disclosure.

## Browser checks

The browser pass is committed as `scripts/browser_check.mjs`. It drives Chrome with Playwright and a scripted SSE router, so it needs no model key. Start the local pair, then:

```bash
npm run check:browser        # 66 checks: pages, consent, failures, DLP, mobile, demo
npm run check:browser:live   # 12 checks against the deployed pair
```

The first run needs Chrome and `npm install` (for `playwright-core`). Override the targets with `AIRLINE_URL` and `PEER_URL`, or the browser with `CHROME_PATH`.

The local pass covers six groups:

1. **Page and receipt (18 checks).** The airline renders nine flights; a manual booking returns a `SKY-` reference; the receipt starts empty, renders consent/fetch/block events, verifies its chain, downloads JSON with no email or key, restores the same chain after a reload, verifies the restored chain, and clears to an empty receipt. The hotel renders three rooms. Both pages have no console errors.
2. **Consent (12 checks).** The card names Harbor Hotel and `localhost:8081`; zero hotel requests occur before consent; allow fetches the hotel and returns its answer; decline sends zero requests and shows one card; the receipt records both paths; both chains verify.
3. **Peer failure (4 checks).** A 503 from the hotel manifest produces an actionable answer, a `peer_error` receipt row with the HTTP status, a chain that still verifies, and no unexpected console errors.
4. **Hostile peer (12 checks).** A committed `tests/fixtures/evil-hotel/` fixture answers with a fake key. An email in the outbound request is blocked before consent and fetch; the hostile reply's `otk_` key is blocked before rendering; both blocks appear in the receipt; both chains verify; the exported JSON contains no key; there are no console errors.
5. **Mobile and accessibility (10 checks).** At 390 px the page and receipt have no horizontal overflow; the chat input has an accessible name; visible form controls have labels; the consent card fits, takes focus, and completes with Tab then Enter.
6. **Keyless demo (10 checks).** **Try the scripted demo (no key)** boots without a key, shows `⚠ MOCK LLM — no real model`, explains the scripted path, calls no provider, returns the hotel's published facts, writes the consent and peer fetch to the receipt, verifies the chain, exits back to the key requirement, and has no console errors.

The hosted pass repeats the consent and receipt checks against the deployed pair: **0** hotel requests before **Allow**, **0** after **Decline**, **11** after **Allow**, the chain verifies, and there are no console errors. `location.origin` is `https://pham-canh.github.io` on the airline and `https://pham-canh.github.io.` on the hotel. `npm run check:origins` repeats the deployment check without a browser. The evidence and the trailing-dot caveat are in [`docs/ORIGIN.md`](ORIGIN.md).

The browser pass uses a scripted SSE router, not a live provider, so it proves the protocol and the boundary without spending tokens. A live Otari run is a separate recording step; do not imply the scripted pass spent real tokens.

## Screenshots

- `docs/screenshots/airline-hero.png` — the airline's landing page.
- `docs/screenshots/airline-booking.png` — a selected flight and manual booking.
- `docs/screenshots/consent.png` — the consent card before any hotel request.
- `docs/screenshots/assistant-answer.png` — the approved cross-site answer.
- `docs/screenshots/privacy-receipt.png` — the receipt with the consent, peer fetch, and blocked value.
- `docs/screenshots/hotel-mobile.png` — the hotel at a phone width.

## Publishing

1. Uploaded to YouTube as **public**: <https://youtu.be/lDLhXmqXv6I> (1:46). The synthetic timing cut is demo-only.
2. The English subtitles are burned into the picture, so no English track is needed. The Vietnamese track is optional.
3. The title, description, tags, and chapters in [`docs/YOUTUBE.md`](YOUTUBE.md) are live.
4. Replace the YouTube thumbnail with `docs/youtube-thumbnail.png`; the current thumbnail is a developer-panel frame.
5. The URL is in `docs/DEVPOST.md`; paste it into the Devpost form.
6. Verify the link in a private browser window before submitting.

## Updated two-minute script (optional re-record)

Use this only if you want a take that matches the current repository. The uploaded video is still valid; its “fourteen tests” line is historical. Narrate this in your own voice, in Vietnamese or English, and burn in English subtitles if the audio is Vietnamese. Do not use a synthetic voice for the entrant's explanation.

| Time | On screen | Narration |
| --- | --- | --- |
| 0:00–0:12 | Split screen: airline page and hotel page, then the consent card | "Booking a trip crosses company boundaries. Your assistant can ask a hotel on your behalf, but today you cannot see which site it contacts, what it sends, or whether you agreed." |
| 0:12–0:28 | Skyline Air hero; highlight the two origins in the URL bar | "Trip Relay is two agentic websites on two origins. Skyline Air sells the flight. Harbor Hotel is a separate company with its own agent network. The airline can ask the hotel directly, with no agent server in the middle. That matters for a small airline or an independent hotel that cannot run one." |
| 0:28–0:48 | Pick a flight, enter a passenger, book it, show the `SKY-` reference | "Start with a normal task. Pick a flight, enter a passenger, and book it. The page owns the write and returns the reference. No model is needed for this path." |
| 0:48–1:08 | Ask for the hotel; the consent card appears; point to the origin, request, and token estimate | "Now ask about a hotel. Before anything leaves the page, the runtime pauses. The card names the other origin, the exact request, and the estimated cost. This is consent at the transport boundary, not a sentence hidden in a prompt." |
| 1:08–1:22 | Press **Decline**; show zero hotel requests; ask again and press **Allow**; show the answer | "Decline, and the hotel is never contacted. Ask again and allow. The browser fetches only the hotel's public network and runs it locally. The hotel receives the request, not my chat history, my passenger record, or my key." |
| 1:22–1:40 | Open **Privacy receipt**; verify, download, reload, show the restored chain, then clear | "Every boundary event goes into a privacy receipt: the consent, the fetch, a blocked value, even a peer failure. I can verify the hash chain, download the redacted log, and reload without losing it. It stays in this tab; it is not a remote audit server." |
| 1:40–1:52 | Terminal: `npm test`, `npm run benchmark:dlp`, browser-check summary | "The repository ships 35 unit tests, a 16-case hostile-peer DLP benchmark, 66 local browser checks, and 12 hosted checks. The tests use a scripted model; the public pair defaults to Otari, and a judge can add a key for a live call." |
| 1:52–2:00 | Closing card with both URLs and the MIT license | "Two websites, one visible boundary. Try the keyless scripted demo, or add your own key. Trip Relay is MIT licensed and live on GitHub Pages." |

The last card should also carry: *“The tests and the scripted demo use a deterministic model, not a live provider. The public pair accepts Otari or any compatible router.”*

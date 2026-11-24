# Demo script and recording checklist

## Recorded take

- Timing cut: [`docs/trip-relay-demo.mp4`](trip-relay-demo.mp4) — 1:45, 1600×900, 30 fps, H.264/AAC, synthetic narration, demo only.
- Entrant-voice cut: [`docs/trip-relay-demo-own-voice.mp4`](trip-relay-demo-own-voice.mp4) — same picture, Vietnamese narration by the entrant, 1:45.5, embedded English subtitle track, submission video.
- Silent cut: [`docs/trip-relay-demo-silent.mp4`](trip-relay-demo-silent.mp4) — same picture, no audio, for recording your own narration.
- Thumbnail: [`docs/youtube-thumbnail.png`](youtube-thumbnail.png) — 1280×720.
- Captions: [`docs/trip-relay-demo-vi.srt`](trip-relay-demo-vi.srt) (Vietnamese) and [`docs/trip-relay-demo.srt`](trip-relay-demo.srt) (English), retimed to the entrant-voice cut.
- The screen recording is the real local pair: the airline at `127.0.0.1:8084` and the hotel at `localhost:8081`. The airline copy used for the take publishes a **scripted OpenAI-compatible endpoint** as its mock router, so the assistant header shows `⚠ MOCK LLM — no real model` for the whole run. The public pair is unchanged and still uses Otari. The narration says this out loud.
- The timing cut uses macOS `say` (Samantha) for timing. The submission cut replaces it with the entrant's Vietnamese take; the English script below documents the demo, and the Vietnamese script is in [`docs/DUB-VI.md`](DUB-VI.md).

The recording proves the protocol and the boundary without spending tokens. It does **not** claim a live Otari call. A live Otari run is a separate take: add an `otk_...` key in **AI model settings** and repeat the same steps.

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

## Browser checks already run

A Playwright pass against Chromium covered:

1. The airline page renders nine flights.
2. Selecting a flight updates the selection.
3. Manual booking returns a `SKY-` reference.
4. Reset clears the booking.
5. Without a key, the page asks for one and stays usable.
6. The airline has no console errors.
7. The hotel page renders as Harbor Hotel.
8. A manual room request returns an `HBR-` reference.
9. The hotel has no console errors.
10. Chat is usable with a saved key.
11. The consent card names Harbor Hotel and `localhost:8081` locally, or `pham-canh.github.io.` hosted.
12. Zero hotel requests occur before consent.
13. The hotel manifest is fetched only after allow.
14. The cross-site answer has no tool error.
15. The model is called for the airline, the hotel, and the summary.
16. The assistant run has no console errors.

The browser pass uses a scripted SSE router, not a live provider, so it proves the protocol and the boundary without spending tokens. A live Otari run is a separate recording step; do not imply the scripted pass spent real tokens.

The hosted pair was checked separately. `location.origin` is `https://pham-canh.github.io` on the airline and `https://pham-canh.github.io.` on the hotel; `localStorage` is isolated; the consent flow produced **0** hotel requests before **Allow**, **0** after **Decline**, and **11** after **Allow**. `npm run check:origins` repeats the deployment check without a key. The evidence and the trailing-dot caveat are in [`docs/ORIGIN.md`](ORIGIN.md). The hosted run also used a scripted endpoint; no live Otari call is claimed.

## Screenshots

- `docs/screenshots/airline-hero.png` — the airline's landing page.
- `docs/screenshots/airline-booking.png` — a selected flight and manual booking.
- `docs/screenshots/consent.png` — the consent card before any hotel request.
- `docs/screenshots/assistant-answer.png` — the approved cross-site answer.
- `docs/screenshots/hotel-mobile.png` — the hotel at a phone width.

## Publishing

1. Upload `docs/trip-relay-demo-own-voice.mp4` to YouTube as **public** (the Devpost rules require a public video). Do not upload the synthetic timing cut as the submission.
2. Add the Vietnamese and English caption tracks.
3. Use the title, description, and tags in [`docs/YOUTUBE.md`](YOUTUBE.md).
4. Set the thumbnail to `docs/youtube-thumbnail.png` if the account allows custom thumbnails.
5. Paste the YouTube URL into `docs/DEVPOST.md` and the Devpost form.
6. Verify the link in a private browser window before submitting.

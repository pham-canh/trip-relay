# Submit Trip Relay

Deadline: **11 January 2027, 16:00 UTC** (8:00am PST). The Devpost form is submitted. The submission video is <https://youtu.be/lDLhXmqXv6I> (Public, 1:46, Vietnamese narration, English subtitles burned in). Remaining: update the live project story and Built With tags, post the DLP/receipt update, replace the YouTube thumbnail, and optionally upload the social preview.

## 1. Repository status

`main` is pushed with the entrant-voice cut, the DLP benchmark, the Privacy receipt, per-tab receipt persistence, the keyless demo, and the expanded browser pass (2026-11-26). The `test` job, the benchmark step, and the manual `origin-check` workflow are green. `PROTOCOL.md`, `docs/ORIGIN.md`, `docs/trip-relay-demo.mp4`, and `docs/trip-relay-demo-own-voice.mp4` load on GitHub, and the README says 35 tests plus the benchmark, with `crytobot459@gmail.com` as the Otari contact.

The live pair was redeployed on 2026-11-26 and serves the DLP runtime, the Privacy receipt with per-tab persistence, and the keyless demo. The airline is commit `92f71cc` on `gh-pages`; the hotel is unchanged at commit `02c84e7` on the `main` branch of `pham-canh/pham-canh.github.io`. `npm run check:origins`, `npm run check:browser` (66/66 local), `npm run check:browser:live` (12/12 hosted, re-run 2026-11-27), and `npm run check:browser:demo` (10/10 hosted, re-run 2026-11-27) pass. A separate live smoke check also confirmed the receipt restores after a reload and clears cleanly. The docs, the origin check, and the browser check live on `main` only.

If a later change needs pushing, the existing Git credentials can push `main`:

```bash
cd /Users/phamcanh/harness/devpost/trip-relay
git push origin main
```

Do not put a token in the remote URL or in a tracked file.

Verify:

- <https://github.com/pham-canh/trip-relay/blob/main/PROTOCOL.md>
- <https://github.com/pham-canh/trip-relay/blob/main/docs/ORIGIN.md>
- <https://github.com/pham-canh/trip-relay/blob/main/docs/trip-relay-demo.mp4>
- <https://github.com/pham-canh/trip-relay/blob/main/docs/trip-relay-demo-own-voice.mp4>

## 2. Verify the hosted boundary

The hotel URL is <https://pham-canh.github.io./> **with a trailing dot**. Do not drop it: `https://pham-canh.github.io/` is the airline's origin.

```bash
npm run check:origins
```

Expected: distinct origins, both manifests 200, the hotel manifest CORS-readable, the airline allows only `https://pham-canh.github.io.`, and the hotel allows no further peers. The browser evidence (two `location.origin` values, isolated `localStorage`, 0 requests before **Allow**, 0 after **Decline**, 11 after **Allow**, the receipt chain verifies) is in [`docs/ORIGIN.md`](ORIGIN.md). After a deployment, you can also run the manual **origin-check** workflow in GitHub Actions.

Repeat the hosted consent and receipt checks in Chrome:

```bash
npm install          # once, for playwright-core
npm run check:browser:live
```

Expected: 12/12 checks pass. For the local pair, start `npm run serve:airline` and `npm run serve:hotel`, then run `npm run check:browser` (66/66).

If an external reviewer says the two sites share an origin, check the URL: they are probably reading `https://pham-canh.github.io/` without the dot. The trailing dot is the boundary.

## 3. Entrant-voice video (uploaded)

The rules say the video **must include the Entrant explaining the Project (not AI generated)**. The uploaded submission video is <https://youtu.be/lDLhXmqXv6I> — Public, 1:46, Vietnamese narration, English subtitles burned into the picture. The synthetic timing cut at <https://youtu.be/uXQRyKOMyxQ> remains demo-only; do not submit it.

The entrant-voice cut:

- File: `docs/trip-relay-demo-own-voice.mp4` (1:45.5, 1600×900, H.264 + mono AAC, English subtitles burned into the picture).
- Silent picture: `docs/trip-relay-demo-silent.mp4`.
- Vietnamese script and pronunciation notes: [`docs/DUB-VI.md`](DUB-VI.md).
- Vietnamese captions: `docs/trip-relay-demo-vi.srt` (retimed to this take).
- English translation source: `docs/trip-relay-demo.srt` (retimed to this take; burned into the picture).
- English transcript: [`docs/VIDEO-TRANSCRIPT.md`](VIDEO-TRANSCRIPT.md).

The upload is done. Remaining YouTube step: set the thumbnail to `docs/youtube-thumbnail.png`; the current thumbnail is a frame with the developer panel. The English subtitles are burned in, so no English caption track is needed; the Vietnamese track is optional. Keep the title, description, tags, and chapters in [`docs/YOUTUBE.md`](YOUTUBE.md). The link is already in [`docs/DEVPOST.md`](DEVPOST.md).

The mux was done with macOS AVFoundation, and the English subtitles were burned in with `ffmpeg`/`libass`. The output was checked for duration, video/audio tracks, and audio sync against the picture cues; the audio stream is identical to the muxed take.

## 4. Fill the Devpost form

Use the sections in [`docs/DEVPOST.md`](DEVPOST.md):

- **Project name:** Trip Relay
- **Tagline:** Two agentic travel websites, one visible consent boundary.
- **Description:** Inspiration, What it does, How we built it, Verification status, Challenges, Accomplishments, What we learned, What's next.
- **Built with:** HTML, CSS, JavaScript, Node.js 22, Neuro SAN agent networks, Mozilla Otari, Playwright, GitHub Actions.
- **Try it:** <https://pham-canh.github.io/trip-relay/> (hotel: <https://pham-canh.github.io./>).
- **Video:** <https://youtu.be/lDLhXmqXv6I>.
- **Screenshots:** `docs/screenshots/airline-hero.png`, `airline-booking.png`, `consent.png`, `assistant-answer.png`, `privacy-receipt.png`, `hotel-mobile.png`.
- **Repository:** <https://github.com/pham-canh/trip-relay>.
- **Otari account email:** `crytobot459@gmail.com`.
- **Otari problem/improvement:** the text in [`docs/OTARI.md`](OTARI.md).

## 5. Live Otari check (recommended)

The tests and the video use a scripted endpoint; they do not claim a live Otari call. If you have an Otari key, spend five minutes on the live path:

1. Open <https://pham-canh.github.io/trip-relay/> in a private window.
2. Open **AI model settings**, choose **Otari (Mozilla)** for a global `otk_...` key or **Otari (Mozilla, EU)** for `otk_v1_eu_...`, paste the key, and save.
3. Ask: *"Can you ask Harbor Hotel for a quiet room near the airport for two nights?"*
4. Confirm the badge is not `MOCK LLM`, the consent card names `pham-canh.github.io.`, and **Allow** returns the hotel answer.
5. If you want a live take, record this flow and replace the video; keep the disclosure accurate.
6. Revoke the key in the Otari console when done. Do not paste it into an issue, a screenshot, or this repo.

## 6. Final checks

- [x] The final YouTube upload uses the entrant's own voice (not AI-generated), plays without signing in, is 1:46, and has English subtitles burned into the picture.
- [ ] Replace the YouTube thumbnail with `docs/youtube-thumbnail.png`.
- [x] Both live origins return HTTP 200, and both serve `/runtime/dlp.js` plus the Privacy receipt.
- [x] `npm run check:origins` passes, and the manual Actions run is green.
- [x] The hosted consent flow shows 0 hotel requests before **Allow**, 0 after **Decline**, and 11 after **Allow**; the receipt chain verifies.
- [x] `npm run check:browser` passes 66/66 locally, `npm run check:browser:live` passes 12/12 against the deployed pair, and `npm run check:browser:demo` passes 10/10 there.
- [x] The keyless demo boots without a key, calls no provider, and writes the consent and peer fetch to the receipt.
- [x] The receipt survives a reload, refuses a tampered stored chain, and clears to a fresh chain.
- [x] PR [#85](https://github.com/cognizant-ai-labs/agentic-web/pull/85) was merged, adding Trip Relay to the official [`agentic_websites.md`](https://github.com/cognizant-ai-labs/agentic-web/blob/main/docs/agentic_websites.md) list.
- [x] The repository is public, the MIT license is visible, and `PROTOCOL.md` loads.
- [x] The GitHub README says 35 tests plus the DLP benchmark, and the Otari email is filled in.
- [x] `npm test` passes 35/35 and `npm run benchmark:dlp` passes 12/12 attacks and 4/4 controls.
- [x] No API key appears in the repository or the Devpost copy; the recording uses a scripted endpoint.
- [ ] The social preview is uploaded in **Settings → Social preview** (`docs/social-preview.png`).
- [x] The Devpost form is submitted before the deadline; keep the confirmation email.
- [ ] Update the live Devpost story at <https://devpost.com/software/trip-relay>: it still says 14 tests and a 16-check pass. Follow the field-by-field edit sheet in [`docs/DEVPOST-EDIT.md`](DEVPOST-EDIT.md); add the Privacy receipt and keyless-demo bullets, and refresh the gallery with `privacy-receipt.png`.
- [ ] Fix the Devpost **Built With** tags with the exact list in [`docs/DEVPOST-EDIT.md`](DEVPOST-EDIT.md): Mozilla Otari, Neuro SAN, Playwright, GitHub Actions, IndexedDB.
- [ ] Post the DLP/receipt update from `docs/DEVPOST.md` after the story is current.

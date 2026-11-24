# Submit Trip Relay

Deadline: **11 January 2027, 16:00 UTC** (8:00am PST). The public pair, the repository, and the entrant-voice video are ready. The submission video is <https://youtu.be/lDLhXmqXv6I> (Public, 1:46, Vietnamese narration, English subtitles burned in). Remaining: replace the YouTube thumbnail, then submit the Devpost form.

## 1. Repository status

`main` is pushed with the entrant-voice cut (2026-11-24). The `test` job and the manual `origin-check` workflow are green. `PROTOCOL.md`, `docs/ORIGIN.md`, `docs/trip-relay-demo.mp4`, and `docs/trip-relay-demo-own-voice.mp4` load on GitHub, and the README now says 14 tests with `crytobot459@gmail.com` as the Otari contact.

The live site is already current: the deployed airline and hotel files match the local `dist-pages` build (verified by hash). `gh-pages` and the hotel repo `pham-canh/pham-canh.github.io` do not need a rebuild unless you change `site/` or `peer/`. The docs and the origin-check script live on `main` only.

If a later change needs pushing, `gh` is authenticated on this machine with `repo` and `workflow` scopes:

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

Expected: distinct origins, both manifests 200, the hotel manifest CORS-readable, the airline allows only `https://pham-canh.github.io.`, and the hotel allows no further peers. The browser evidence (two `location.origin` values, isolated `localStorage`, 0 requests before **Allow**, 0 after **Decline**, 11 after **Allow**) is in [`docs/ORIGIN.md`](ORIGIN.md). After a deployment, you can also run the manual **origin-check** workflow in GitHub Actions.

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
- **Screenshots:** `docs/screenshots/airline-hero.png`, `airline-booking.png`, `consent.png`, `assistant-answer.png`, `hotel-mobile.png`.
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
- [x] Both live origins return HTTP 200.
- [x] `npm run check:origins` passes, and the manual Actions run is green.
- [x] The hosted consent flow shows 0 hotel requests before **Allow**.
- [x] The repository is public, the MIT license is visible, and `PROTOCOL.md` loads.
- [x] The GitHub README says 14 tests (not 13) and the Otari email is filled in.
- [x] No API key appears in the repository or the Devpost copy; the recording uses a scripted endpoint.
- [ ] The social preview is uploaded in **Settings → Social preview** (`docs/social-preview.png`).
- [ ] The Devpost form is submitted before the deadline; keep the confirmation email.

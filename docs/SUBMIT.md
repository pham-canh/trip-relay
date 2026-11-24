# Submit Trip Relay

Deadline: **11 January 2027, 16:00 UTC** (8:00am PST). The public pair and the video cut are ready; the remaining steps need your GitHub and Devpost logins.

## 1. Push `main`

GitHub `main` is still at `c575f79`. The local `main` has the protocol note, the two-origin build script, the demo video, the origin proof, and the updated docs. Until you push, `PROTOCOL.md`, `docs/ORIGIN.md`, and `docs/trip-relay-demo.mp4` 404 on GitHub, and the GitHub README still says "13 tests" and carries the old Otari placeholder. Those stale docs are what an external reviewer sees.

```bash
cd /Users/phamcanh/harness/devpost/trip-relay
git push origin main
```

The live site is already current: the deployed airline and hotel files match the local `dist-pages` build (verified by hash). `gh-pages` and the hotel repo `pham-canh/pham-canh.github.io` do not need a rebuild unless you change `site/` or `peer/`. The docs and the origin-check script live on `main` only.

If the push asks for credentials, authenticate first with `gh auth login`, an SSH key, or a personal access token. Do not put a token in the remote URL or in a tracked file.

Verify:

- <https://github.com/pham-canh/trip-relay/blob/main/PROTOCOL.md>
- <https://github.com/pham-canh/trip-relay/blob/main/docs/ORIGIN.md>
- <https://github.com/pham-canh/trip-relay/blob/main/docs/trip-relay-demo.mp4>

## 2. Verify the hosted boundary

The hotel URL is <https://pham-canh.github.io./> **with a trailing dot**. Do not drop it: `https://pham-canh.github.io/` is the airline's origin.

```bash
npm run check:origins
```

Expected: distinct origins, both manifests 200, the hotel manifest CORS-readable, the airline allows only `https://pham-canh.github.io.`, and the hotel allows no further peers. The browser evidence (two `location.origin` values, isolated `localStorage`, 0 requests before **Allow**, 0 after **Decline**, 11 after **Allow**) is in [`docs/ORIGIN.md`](ORIGIN.md).

If an external reviewer says the two sites share an origin, check the URL: they are probably reading `https://pham-canh.github.io/` without the dot, or the stale README on GitHub `main`. The trailing dot is the boundary.

## 3. Upload the video

- File: `docs/trip-relay-demo.mp4` (1:45, 1600×900).
- Title, description, tags: [`docs/YOUTUBE.md`](YOUTUBE.md).
- Visibility: **Public**.
- Thumbnail: `docs/youtube-thumbnail.png`.
- Captions: `docs/trip-relay-demo.srt`.
- If the rules require the entrant's own voice, record over `docs/trip-relay-demo-silent.mp4` with [`docs/DUB.md`](DUB.md) and upload that cut instead.

Paste the watch URL into `docs/DEVPOST.md` (the `Demo video:` line and the `## Demo video` section), then commit and push that change.

## 4. Fill the Devpost form

Use the sections in [`docs/DEVPOST.md`](DEVPOST.md):

- **Project name:** Trip Relay
- **Tagline:** Two agentic travel websites, one visible consent boundary.
- **Description:** Inspiration, What it does, How we built it, Verification status, Challenges, Accomplishments, What we learned, What's next.
- **Built with:** HTML, CSS, JavaScript, Node.js 22, Neuro SAN agent networks, Mozilla Otari, Playwright, GitHub Actions.
- **Try it:** <https://pham-canh.github.io/trip-relay/> (hotel: <https://pham-canh.github.io./>).
- **Video:** the YouTube URL.
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

- [ ] The YouTube link plays in a private window, without signing in, and is under two minutes.
- [ ] Both live origins return HTTP 200.
- [ ] `npm run check:origins` passes.
- [ ] The hosted consent flow shows 0 hotel requests before **Allow**.
- [ ] The repository is public, the MIT license is visible, and `PROTOCOL.md` loads.
- [ ] The GitHub README says 14 tests (not 13) and the Otari email is filled in.
- [ ] No API key appears in the repo, screenshots, video, or Devpost copy.
- [ ] The social preview is uploaded in **Settings → Social preview** (`docs/social-preview.png`).
- [ ] The Devpost form is submitted before the deadline; keep the confirmation email.

# Submit Trip Relay

Deadline: **11 January 2027, 16:00 UTC** (8:00am PST). The public pair and the video cut are ready; the remaining steps need your GitHub and Devpost logins.

## 1. Push `main`

GitHub `main` is still at `c575f79`. The local `main` has the protocol note, the two-origin build script, the demo video, and the updated docs. Until you push, `PROTOCOL.md` and `docs/trip-relay-demo.mp4` 404 on GitHub.

```bash
cd /Users/phamcanh/harness/devpost/trip-relay
git push origin main
```

If the push asks for credentials, authenticate first with `gh auth login`, an SSH key, or a personal access token. Do not put a token in the remote URL or in a tracked file.

Verify:

- <https://github.com/pham-canh/trip-relay/blob/main/PROTOCOL.md>
- <https://github.com/pham-canh/trip-relay/blob/main/docs/trip-relay-demo.mp4>

## 2. Upload the video

- File: `docs/trip-relay-demo.mp4` (1:45, 1600×900).
- Title, description, tags: [`docs/YOUTUBE.md`](YOUTUBE.md).
- Visibility: **Public**.
- Thumbnail: `docs/youtube-thumbnail.png`.
- If the rules require the entrant's own voice, record over `docs/trip-relay-demo-silent.mp4` with [`docs/DUB.md`](DUB.md) and upload that cut instead.

Paste the watch URL into `docs/DEVPOST.md` (the `Demo video:` line and the `## Demo video` section), then commit and push that change.

## 3. Fill the Devpost form

Use the sections in [`docs/DEVPOST.md`](DEVPOST.md):

- **Project name:** Trip Relay
- **Tagline:** Two agentic travel websites, one visible consent boundary.
- **Description:** Inspiration, What it does, How we built it, Challenges, Accomplishments, What we learned, What's next.
- **Built with:** HTML, CSS, JavaScript, Node.js 22, Neuro SAN agent networks, Mozilla Otari, Playwright, GitHub Actions.
- **Try it:** <https://pham-canh.github.io/trip-relay/> (hotel: <https://pham-canh.github.io./>).
- **Video:** the YouTube URL.
- **Screenshots:** `docs/screenshots/airline-hero.png`, `airline-booking.png`, `consent.png`, `assistant-answer.png`, `hotel-mobile.png`.
- **Repository:** <https://github.com/pham-canh/trip-relay>.
- **Otari account email:** `crytobot459@gmail.com`.
- **Otari problem/improvement:** the text in [`docs/OTARI.md`](OTARI.md).

## 4. Final checks

- [ ] The YouTube link plays in a private window, without signing in, and is under two minutes.
- [ ] Both live origins return HTTP 200.
- [ ] The repository is public, the MIT license is visible, and `PROTOCOL.md` loads.
- [ ] No API key appears in the repo, screenshots, video, or Devpost copy.
- [ ] The social preview is uploaded in **Settings → Social preview** (`docs/social-preview.png`).
- [ ] The Devpost form is submitted before the deadline; keep the confirmation email.

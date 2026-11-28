# Edit the live Devpost project

Live page: <https://devpost.com/software/trip-relay>

Edit the project story itself. An **Update** is a progress log and does not replace the stale sections below. The source text is [`docs/DEVPOST.md`](DEVPOST.md); copy each named section from there.

Copy the rendered text from the GitHub view, not the raw Markdown: Devpost does not render backticks, so remove them or use Devpost's code formatting.

## 0. Tagline

Replace the tagline with:

> Two agentic travel sites, one visible boundary. Zero hotel requests before you press Allow.

The number is measured: the browser check asserts zero hotel requests before **Allow**.

## 1. What it does

At the start of **What it does**, add the bold hook line:

> **Before you press Allow, the hotel receives zero requests.**

After the paragraph ending “work without a model key for the manual flight-booking and room-request paths.”, add the two bullets from **What it does** in `docs/DEVPOST.md`:

- **Privacy receipt** — verifies the hash chain, downloads the redacted JSON, survives a reload, refuses a tampered store, and clears to a fresh chain.
- **Keyless scripted demo** — the real consent card and receipt without an Otari key; one read or peer call, never a write, no provider request.

Leave the following “reference implementation” paragraph in place.

## 2. How we built it

Replace the bullet that starts:

> 14 `node:test` checks run the real runtime with a scripted model; a 16-check Playwright pass…

with the current bullet under **How we built it** in `docs/DEVPOST.md`, which starts:

> 35 `node:test` checks run the real runtime with a scripted model…

It covers 35 unit tests, 67 local browser checks, 13 hosted consent/receipt checks, 10 hosted demo checks, the 12-attack + 4-control benchmark, per-tab IndexedDB persistence, and `peer_error`.

## 3. Verification status

Replace the **Protocol and consent** bullet with the current one in `docs/DEVPOST.md`.

Replace the **Hosted boundary** bullet with the current one. It now records the 2026-11-28 13/13 consent pass and the 10/10 keyless-demo pass.

Keep **Live Otari call: not yet recorded** and **Scope** as they are.

## 4. Accomplishments

Replace:

> 14 unit tests, 16 browser checks, and GitHub Actions on every push…

with the current bullet:

> 35 unit tests, a 16-case hostile-peer DLP benchmark (12 attacks + 4 controls), 67 browser checks, and GitHub Actions on every push…

Then add the next two bullets from `docs/DEVPOST.md`: the Privacy receipt and the keyless scripted demo.

## 5. Built With

Current tags: `css`, `github`, `html`, `javascript`, `mozilla`, `neuro`, `node.js`, `otira`, `san`.

Use:

```text
css
github
html
javascript
mozilla otari
neuro san
node.js
playwright
github actions
indexeddb
```

This replaces `otira` with **Mozilla Otari**, merges `neuro` + `san` into **Neuro SAN**, and adds Playwright, GitHub Actions, and IndexedDB.

## 6. Gallery

The redesign adds a hotel hero image and refreshes the drawer screenshots. Replace the gallery with these seven images, in this order, using the captions from `docs/DEVPOST.md`:

1. `docs/screenshots/airline-hero.png`
2. `docs/screenshots/hotel_hero.png`
3. `docs/screenshots/airline-booking.png`
4. `docs/screenshots/consent.png`
5. `docs/screenshots/assistant-answer.png`
6. `docs/screenshots/privacy-receipt.png`
7. `docs/screenshots/hotel-mobile.png`

All seven were recaptured from the deployed pair on 2026-11-28. The consent, answer, and receipt shots use the keyless demo and show the real `pham-canh.github.io.` origin plus the visible `MOCK LLM` label.

## 7. When Lolo's English video is live

Do the Devpost and YouTube edits in one pass, after the new video is public and plays without signing in:

1. Check the video in a private window: English narration, entrant voice (not AI), the consent card and **0 requests before Allow** are visible, the `⚠ MOCK LLM` badge is visible, and the title is `Trip Relay — 0 hotel requests before Allow | Open Agentic Web Challenge`.
2. Put the new URL in the Devpost **Demo video** field.
3. Replace the old “Vietnamese narration” sentence in `docs/DEVPOST.md` and `docs/YOUTUBE.md` with the English-video wording; keep the old 1:46 cut only as a backup.
4. Update the Devpost story with the sections above: tagline, hook, numbers, Built With, gallery, credits.
5. Replace the YouTube thumbnail with `docs/youtube-thumbnail.png` and paste the description/tags from `docs/VIDEO-BRIEF-EN.md`.
6. Re-run `node scripts/check-links.mjs`; no site code changes are expected.
7. Keep the old video public until the new one is confirmed, then update the submission link.

## 8. After the story is current

1. Post the **Update draft** from `docs/DEVPOST.md`.
2. Replace the YouTube thumbnail with `docs/youtube-thumbnail.png`.
3. Update the YouTube description from `docs/YOUTUBE.md`; it now points at the keyless demo and states that the video's “fourteen tests” line is historical.
4. Upload `docs/social-preview.png` in **Settings → Social preview**.
5. Revoke the broad GitHub PAT and any Otari key used during development.

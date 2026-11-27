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

It covers 35 unit tests, 66 local browser checks, 12 hosted consent/receipt checks, 10 hosted demo checks, the 12-attack + 4-control benchmark, per-tab IndexedDB persistence, and `peer_error`.

## 3. Verification status

Replace the **Protocol and consent** bullet with the current one in `docs/DEVPOST.md`.

Replace the **Hosted boundary** bullet with the current one. It now records the 2026-11-27 12/12 consent pass and the 10/10 keyless-demo pass.

Keep **Live Otari call: not yet recorded** and **Scope** as they are.

## 4. Accomplishments

Replace:

> 14 unit tests, 16 browser checks, and GitHub Actions on every push…

with the current bullet:

> 35 unit tests, a 16-case hostile-peer DLP benchmark (12 attacks + 4 controls), 66 browser checks, and GitHub Actions on every push…

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

The live gallery already has five images: airline hero, booking, consent, assistant answer, and hotel mobile. It is missing the Privacy receipt. Add `docs/screenshots/privacy-receipt.png` (refreshed 2026-11-27) as the fifth image, with the caption from `docs/DEVPOST.md`. The full order is:

1. `docs/screenshots/airline-hero.png`
2. `docs/screenshots/airline-booking.png`
3. `docs/screenshots/consent.png`
4. `docs/screenshots/assistant-answer.png`
5. `docs/screenshots/privacy-receipt.png`
6. `docs/screenshots/hotel-mobile.png`

## 7. After the story is current

1. Post the **Update draft** from `docs/DEVPOST.md`.
2. Replace the YouTube thumbnail with `docs/youtube-thumbnail.png`.
3. Update the YouTube description from `docs/YOUTUBE.md`; it now points at the keyless demo and states that the video's “fourteen tests” line is historical.
4. Upload `docs/social-preview.png` in **Settings → Social preview**.
5. Revoke the broad GitHub PAT and any Otari key used during development.

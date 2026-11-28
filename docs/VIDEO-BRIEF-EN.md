# Trip Relay demo video brief — English

For Lolo (Euloge), the demo-video owner on the Trip Relay team.

## Goal

Record a **60–90 second** demo of Trip Relay using the new deployed UI. The video must show:

- a real person using the site (book a flight, ask the hotel);
- the problem: two sites on different origins, and an agent handoff that is normally invisible;
- the solution: a consent card with the exact origin, purpose, and request; **0 hotel requests before Allow**;
- the value of the agent: delegation, consent, receipt, and DLP;
- the closing: keyless demo and repo.

## Rule check

Lolo is listed on the Devpost team as **@Euloge_11**, so his English narration is the plan. The challenge requires the video to include the entrant explaining the project, not AI-generated narration: keep the voice real, do not use an AI voice, and do not fake a live model call.

## Format

- 1600×900 or 1920×1080, 16:9, 30 fps.
- H.264 + AAC, clear audio, no clipping.
- 60–90 seconds; aim for 90.
- Record the browser window only, not a full desktop with personal tabs.
- Use the keyless demo, **never type an API key**, and do not show real emails or accounts.
- Use the fictional passenger `Alex Nguyen` / `alex@example.com`.
- Keep the `⚠ MOCK LLM` badge visible and say it is a scripted demo.

## Shot list and English narration

| Time | Picture | Narration |
|---|---|---|
| 0:00–0:08 | Airline hero, then hotel hero | “Booking a flight and a hotel usually means two websites. Agents can talk to each other, but today those requests often leave without you seeing them.” |
| 0:08–0:18 | Skyline Air: select a flight, enter passenger, book | “This is Skyline Air. I'll pick a flight, enter a demo passenger, and book it. The SKY reference is the confirmation.” |
| 0:18–0:32 | Open **Ask Skyline**, ask about Harbor Hotel | “Now I'll ask Harbor Hotel about a room. Before anything leaves this page, the consent card shows the exact origin, the purpose, and the request. Until I press Allow, the hotel receives zero requests.” |
| 0:32–0:42 | **Decline**; ask again; **Allow**; hotel answer | “Decline, and the hotel is never contacted. Ask again and Allow: the browser fetches only the hotel's public network and runs it locally.” |
| 0:42–0:55 | **Receipt** tab: verify, events, download, reload, clear | “Every boundary event goes into the Privacy receipt. I can verify the hash chain, inspect the events, download the redacted JSON, reload and restore it, then clear it.” |
| 0:55–1:08 | Diagram, or cut between the two sites | “The hotel publishes data, not an agent server. The caller's browser enforces consent and keeps the key. That's what the agent adds: delegation with a visible boundary, a receipt, and DLP.” |
| 1:08–1:20 | Closing card with both URLs and repo | “Try the keyless demo at pham-canh.github.io/trip-relay. The hotel is at pham-canh.github.io. Source and protocol are on GitHub. MIT licensed.” |

## How to record

1. Open a clean Chrome profile, turn off notifications, set zoom to 100%.
2. Open <https://pham-canh.github.io/trip-relay/>.
3. Press **Ask Skyline** → **Try the scripted demo (no key)**.
4. Record with QuickTime (File → New Screen Recording) or OBS; capture the browser window only.
5. Record narration separately with a headset or phone for clean audio; sync in CapCut/DaVinci.
6. Export a draft `.mp4` plus the separate audio and script; keep them in Drive/Dropbox as a backup. **Do not commit a large video to the repo.**

## YouTube upload

- Visibility: **Unlisted first** for a quick review, then **Public**. If confident, upload as **Public** directly.
- Audience: **Not made for kids**.
- Title:

```
Trip Relay — 0 hotel requests before Allow | Open Agentic Web Challenge
```

- Description:

```
Zero hotel requests before you press Allow. Two agentic travel sites, one visible consent boundary.

Skyline Air books a flight. Its assistant can ask Harbor Hotel — a different browser origin — but only after you see the origin, the purpose, and the exact request. Decline and the hotel is never contacted. Allow and the hotel's public network runs in your browser.

Live demo: https://pham-canh.github.io/trip-relay/
No key? Press "Try the scripted demo" to see the real consent card and Privacy receipt.
Hotel (deliberate trailing-dot origin): https://pham-canh.github.io./
Source: https://github.com/pham-canh/trip-relay
Protocol: https://github.com/pham-canh/trip-relay/blob/main/PROTOCOL.md

Recording note: this demo uses a scripted OpenAI-compatible endpoint so the handoff is reproducible; the assistant badge says "MOCK LLM — no real model" throughout. The same page accepts Mozilla Otari or any compatible router with a key. The manual booking paths work without a key.

Built for the Open Agentic Web Challenge. MIT licensed.
```

- Tags:

```
agentic web, AI agents, consent, Mozilla Otari, Neuro SAN, cross-origin, privacy, travel demo, open agentic web challenge, JavaScript
```

- Thumbnail: `docs/youtube-thumbnail.png` if the account has custom thumbnails; otherwise skip it.
- Send the watch link to Phạm Cảnh when it is live.

## Deadline

- Draft: **5 December 2026**
- Final: **20 December 2026**
- Submission: **11 January 2027, 16:00 UTC**

## Do not

- Use an AI voice.
- Claim a live Otari call when using the keyless demo.
- Show an API key, real email, or personal information.
- Record a real booking or payment.

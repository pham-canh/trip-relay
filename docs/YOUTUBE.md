# YouTube upload

## Title

```
Trip Relay — consent-gated agent handoff | Open Agentic Web Challenge
```

## Description

```
Two travel agentic websites, one visible consent boundary.

Skyline Air books a flight. Its assistant can ask Harbor Hotel — a different browser origin — but only after you see the origin, the purpose, and the exact request. Decline and the hotel is never contacted. Allow and the hotel's public network runs in your browser.

Live demo: https://pham-canh.github.io/trip-relay/
Hotel (deliberate trailing-dot origin): https://pham-canh.github.io./
Source: https://github.com/pham-canh/trip-relay
Protocol: https://github.com/pham-canh/trip-relay/blob/main/PROTOCOL.md

Chapters:
0:00 Two sites, two origins
0:08 Book a flight
0:24 The consent card
0:48 Decline: zero requests
0:57 Allow: the handoff
1:23 Tests and trace
1:33 Closing

Recording note: this cut uses a scripted OpenAI-compatible endpoint so the handoff is reproducible; the assistant badge says "MOCK LLM — no real model" throughout. The same page accepts Mozilla Otari or any compatible router with a key. The manual booking paths work without a key.

Built for the Open Agentic Web Challenge. MIT licensed.
```

## Tags

```
agentic web, AI agents, consent, Mozilla Otari, Neuro SAN, cross-origin, privacy, travel demo, open agentic web challenge, JavaScript
```

## Upload steps

1. Open <https://studio.youtube.com/> and sign in with `crytobot459@gmail.com`.
2. **Create → Upload videos**, then choose `docs/trip-relay-demo.mp4`.
3. Paste the title and description above. Add the tags.
4. Upload `docs/youtube-thumbnail.png` as the thumbnail if the account allows custom thumbnails.
5. Audience: **Not made for kids**. Visibility: **Public**.
6. Wait for HD processing to finish, then copy the watch URL.
7. Put the URL in `docs/DEVPOST.md` (`Demo video:`) and in the Devpost form.
8. Open the link in a private window to confirm it plays without signing in.

## If the rules require the entrant's own voice

The current cut uses a synthetic narration track for timing. Record the script in [`docs/DUB.md`](DUB.md) over `docs/trip-relay-demo-silent.mp4`, mux the result, and upload that file instead. Keep the same title, description, and disclosure.

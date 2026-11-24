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
0:09 Book a flight
0:24 The consent card
0:48 Decline: zero requests
0:57 Allow: the handoff
1:23 Tests and trace
1:33 Closing

Recording note: this cut uses a scripted OpenAI-compatible endpoint so the handoff is reproducible; the assistant badge says "MOCK LLM — no real model" throughout. The same page accepts Mozilla Otari or any compatible router with a key. The manual booking paths work without a key.

Language: Vietnamese narration by the entrant, with English captions burned into the picture. English transcript: https://github.com/pham-canh/trip-relay/blob/main/docs/VIDEO-TRANSCRIPT.md

Built for the Open Agentic Web Challenge. MIT licensed.
```

## Tags

```
agentic web, AI agents, consent, Mozilla Otari, Neuro SAN, cross-origin, privacy, travel demo, open agentic web challenge, JavaScript
```

## Upload steps

The submission upload is complete at <https://youtu.be/lDLhXmqXv6I>. These steps remain for a re-upload.

1. Open <https://studio.youtube.com/> and sign in with `crytobot459@gmail.com`.
2. **Create → Upload videos**, then choose `docs/trip-relay-demo-own-voice.mp4` — the entrant-voice cut, not the synthetic timing cut.
3. Paste the title and description above. Add the tags.
4. Upload `docs/youtube-thumbnail.png` as the thumbnail if the account allows custom thumbnails.
5. Under **Subtitles**, the English text is already burned into the picture, so do **not** upload `docs/trip-relay-demo.srt` as an English track — it would duplicate the burned-in text. Optionally upload `docs/trip-relay-demo-vi.srt` as **Vietnamese**. The English SRT stays in the repo as the translation source.
6. Audience: **Not made for kids**. Visibility: **Public**.
7. Wait for HD processing to finish, then copy the watch URL.
8. Put the URL in `docs/DEVPOST.md` (`Demo video:`) and in the Devpost form.
9. Open the link in a private window to confirm it plays without signing in.

## Published

- **Submission video:** <https://youtu.be/lDLhXmqXv6I> — Public, 1:46, entrant-voice cut with English subtitles burned into the picture.
- Synthetic timing cut (demo only): <https://youtu.be/uXQRyKOMyxQ> — Public, 1:45, synthetic narration; do not submit.
- Checked on 2026-11-24 without cookies: oEmbed 200, public, downloadable. Frames at 0:00, 0:17, 0:49, 1:20, and 1:44 show the burned-in English subtitles.
- **Thumbnail:** the current YouTube thumbnail is a video frame with the developer panel. Replace it with `docs/youtube-thumbnail.png` in YouTube Studio before submitting. If the account has no custom-thumbnail option, verify the channel at <https://www.youtube.com/verify>.
- The video is 360p in the anonymous download; check that higher resolutions finish processing before sharing.

## Own-voice cut

The entrant's Vietnamese take is muxed into `docs/trip-relay-demo-own-voice.mp4` (1:45.5, 1600×900, AAC) and published at <https://youtu.be/lDLhXmqXv6I>. The picture is `docs/trip-relay-demo-silent.mp4`; the narration is the entrant's own voice, not synthetic. The English subtitles are burned into the picture, and the caption files are retimed to this take, with the long “allow” section split into three cues. Keep the timing cut only as a public demo.

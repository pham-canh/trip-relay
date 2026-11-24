# Record your own narration

The recorded cut uses a synthetic voice for timing. If the challenge requires the entrant's own voice, record this script over the silent video and mux the result.

## What you need

- `docs/trip-relay-demo-silent.mp4` — the final picture, no audio, 1:45.
- A microphone and QuickTime Player (or any recorder).
- `ffmpeg` on your PATH.

## Record

1. Open `docs/trip-relay-demo-silent.mp4` in QuickTime Player at full screen.
2. Start a screen/audio recording in QuickTime (**File → New Audio Recording** is enough if you play the video in another window; use headphones so the silent video's system audio is not captured).
3. Play the video from the start and read the lines below at the matching times. Leave the pauses; the picture is already cut to them.
4. Save the recording as `voice.m4a` in the repo root.

## Script

| Start | Line |
| --- | --- |
| 0:00 | Two travel websites. Two separate origins. One assistant that can cross between them, but only with your permission. |
| 0:08 | Start on Skyline Air. Pick a flight, enter a passenger, and book it. The page holds the state, issues the reference, and never leaves the browser. |
| 0:24 | Now ask the concierge about a hotel. The model wants to call Harbor Hotel, a different origin published by a different site. This take uses a scripted model endpoint, so the handoff is reproducible. The same page runs Otari with a key. Before anything leaves the page, you see who will be contacted, why, and the exact request. |
| 0:48 | Decline. The runtime stops the call. Zero requests reach the hotel, and the assistant tells you so. |
| 0:57 | Ask again, and allow. The runtime fetches the hotel's published manifest, checks its policy, and runs its network. Harbor Hotel receives the request, not your chat history, and not your model key. |
| 1:23 | The trace shows every hop. Origin, peer, consent, and result. Fourteen tests cover the runtime and the boundary. |
| 1:33 | Trip Relay. Two sites, one visible boundary. Live on GitHub Pages. MIT licensed. Built on the MVP Profile, with Mozilla Otari as the default router. |

The recording is 1:45; the last line should end around 1:45. If your take runs long, trim the pauses, not the picture.

## Mux

```bash
ffmpeg -i docs/trip-relay-demo-silent.mp4 -i voice.m4a \
  -c:v copy -c:a aac -b:a 192k -shortest docs/trip-relay-demo-own-voice.mp4
```

If the voice starts late, add `-itsoffset 0.4` before `-i voice.m4a`, or trim the start of the voice file.

Check the result:

```bash
ffmpeg -i docs/trip-relay-demo-own-voice.mp4
```

Upload that file to YouTube instead of the synthetic cut. Keep the same description and disclosure.

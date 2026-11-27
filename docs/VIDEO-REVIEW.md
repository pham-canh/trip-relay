# Video review: the reference clip vs the current cut

The clip `FDown.vn_Tai_video_Facebook_360p (SD)_1128.mp4` is byte-identical to the earlier `..._c056.mp4` (same SHA-256). It is a 99-second Vietnamese SaaS explainer, not a Trip Relay recording. This note compares its storytelling with the submitted 1:45.5 cut and lists what to change.

## What the reference does well

- **Hook with a number.** It opens on `26:00` and `$9.30`, then repeats `26 phút`, `20 cent`, `20 khách`, `$0.30`, `$149`, `12 tháng`. The viewer remembers the numbers, not the feature list.
- **A numbered spine.** Every section carries a chip: `1/5 Repo`, `2/5 Gọi dịch vụ`, `3/5 Chọn đúng khách`, `4/5 Danh sách khách`, `5/5 Quảng cáo`. The viewer always knows where they are.
- **A new visual every 2–4 seconds.** Text card, diagram, screenshot, host, meme, receipt, table. No shot overstays.
- **Proof next to the claim.** A real restaurant (`Fonda Santa Rosa`, `4.6★`, `1,618` reviews) and an owner email sit beside the pitch. The math is a simple table, not a terminal.
- **Honest contrast.** `0 email đã gửi`, `0 doanh thu`, `Không khen giá` — the clip admits what has not worked. That makes the successful numbers credible.
- **One CTA.** It ends on `Code tiếp SaaS` and a button, not a feature recap.

## Audit of the current Trip Relay cut

| Time | What is on screen | Issue |
| --- | --- | --- |
| 0:00–0:09 | Airline hero | Opens with an abstract “two websites” line; no number or concrete pain. |
| 0:09–0:23 | Flight list, booking form, confirmation | Useful, but one static wide shot for 14 seconds; the booking reference is small. |
| 0:24–0:49 | Assistant panel, consent card | 25 seconds on one screen; the consent card is small and surrounded by empty chat space. |
| 0:49–0:56 | Decline | Good moment, but “zero requests” is only spoken; no big visual counter. |
| 0:57–1:04 | Allow, manifest fetch | The answer is small; the origin boundary is explained, not shown. |
| 1:04–1:08 | Raw network/JSON overlay | The weakest shot: an unreadable wall of text covers the product. |
| 1:08–1:24 | Hotel answer | The hotel facts are visible but not highlighted; the receipt is still off screen. |
| 1:24–1:33 | Terminal + “Trip Relay” slide | Text-heavy and developer-facing; says “fourteen tests”, which is now stale. |
| 1:33–1:45 | Closing card | Three small lines; no clear “try it now” CTA or keyless-demo pointer. |

The cut is honest and complete, but it is a screen recording of a product, while the reference is a designed explainer. The gap is presentation, not substance.

## Priority fixes

### P0 — do these if you re-record

1. **New 8-second hook.** Full-screen `0 requests before you say yes`, then the consent card. Narration: “Your assistant can ask a hotel for you. The question is what leaves your browser before you agree. Here, the answer is nothing.”
2. **Replace the raw JSON shot.** Use a three-step diagram: `fetch public manifest → check peer policy → run the data-only network locally`. Highlight one policy line; never show the whole document.
3. **Replace the terminal with a proof card.** `12/12 attacks blocked`, `0 canary egress`, `35 unit tests`, `66 browser checks`, `12/12 hosted`. Re-record the “fourteen tests” line; do not put a stale number on screen.
4. **Zoom to the active panel.** Browser at 125–150%, clean profile, no bookmarks or extensions. Crop to the consent card, then the receipt; do not show the full page with empty chat space.
5. **Make the receipt a hero.** Open it, press **Verify chain**, show the three events, then the reload restore. Give it 8–10 seconds. This is the differentiator.
6. **Add a step tracker.** `1/5 Book`, `2/5 Ask`, `3/5 Consent`, `4/5 Receipt`, `5/5 Proof` in a corner of every shot.
7. **End on one action.** `Try the keyless demo — no key needed` with the URL and a QR code. Add `Add your key for a live Otari call` as the secondary line.
8. **Tighten to about 90 seconds.** The current cut spends 25 seconds on the consent setup and 27 seconds on allow; 15 and 18 are enough.

### P1 — high value

- Add a small webcam inset at the open and close, or at least a human face for two seconds. The reference uses a host to build trust.
- Add a `0 requests` / `11 requests` counter beside the consent card. The browser check already measures both.
- Put the strongest numbers on screen, not in narration: `0`, `11`, `12/12`, `35`, `66`.
- State what agents add in one sentence: “The hotel publishes a data-only network; it does not run an agent server or receive the traveler’s key.”
- Add subtle royalty-free music under the voice and normalize the narration. The reference has energy; the current cut is quiet.
- Use the site’s cream/navy/gold palette and serif headings for every title card, so the video and the product look like one artifact.

### P2 — polish

- Thumbnail: `0 requests before Allow` plus the consent card, not only the abstract tagline.
- Subtitles: larger type, two lines maximum, solid contrast; keep the English burn-in.
- Add a 2-second “decline → 0 requests” shot with the network panel or a counter overlay.
- Add a 2-second “tampered store refused” shot if it can be staged cleanly; it proves the receipt is not decorative.

## 90-second shot list

| Time | Visual | Narration |
| --- | --- | --- |
| 0:00–0:08 | Full-screen `0 requests before you say yes`; cut to the consent card | “Your assistant can ask a hotel for you. The question is what leaves your browser before you agree. Here, the answer is nothing.” |
| 0:08–0:18 | Split screen: airline and hotel URLs; highlight the trailing dot | “Two companies, two browser origins. The airline can ask the hotel directly, with no agent server in the middle.” |
| 0:18–0:30 | Zoomed booking: pick a flight, enter a passenger, show `SKY-` reference | “Start with a normal task. Book a flight. The page owns the write and returns the reference.” |
| 0:30–0:42 | Assistant; consent card fills the frame; highlight origin, request, token estimate | “Now ask about a hotel. Before anything leaves the page, the card names the origin, the exact request, and the cost.” |
| 0:42–0:52 | **Decline**; big `0 requests`; ask again, **Allow**; hotel answer | “Decline, and the hotel is never contacted. Allow, and the browser fetches only its public network.” |
| 0:52–1:08 | Receipt: open, **Verify chain**, show events, reload, restore | “Every boundary event goes into a receipt. Verify the chain, download the redacted log, reload without losing it.” |
| 1:08–1:20 | Proof card: `12/12`, `0`, `35`, `66`, `12/12` | “Twelve hostile-peer attacks blocked, zero canary egress, thirty-five unit tests, sixty-six browser checks.” |
| 1:20–1:30 | Simple diagram: hotel manifest → policy → local network; no agent server | “The hotel publishes data, not an agent server. The browser enforces consent and keeps the key on the caller’s side.” |
| 1:30–1:38 | Closing: keyless demo URL, QR, MIT | “Try the keyless demo, or add your key for a live Otari call. Two sites, one visible boundary.” |

## What can be fixed without re-recording

- Replace the raw JSON shot at 1:04 with a designed three-step card.
- Add big-number overlays at 0:49 (`0 requests`) and 1:24 (`14 tests in this cut; 35 now`).
- Add a step tracker and a closing CTA overlay.
- Add music and normalize the voice.

These edits improve the current cut, but they cannot fix the stale “fourteen tests” narration or the slow first half. A re-record with the 90-second script is the stronger option.

## Draft re-cut with the same voice

[`docs/trip-relay-demo-v2-draft.mp4`](trip-relay-demo-v2-draft.mp4) is a local draft that keeps the entrant's existing audio and fixes four visuals:

- a `0 hotel requests before Allow` callout at the decline;
- a three-step **Fetch → Check → Run** card in place of the raw JSON overlay;
- a proof card with `12/12`, `0`, `35`, `66`, and `12/12` in place of the terminal;
- a closing card with **Try the keyless demo — no key needed** and both URLs.

It still says “fourteen tests” in the narration; the proof card states both the recorded count and the current count. Treat it as a visual upgrade, not the final re-record. The draft is not linked from the submission.

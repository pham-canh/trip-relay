# Demo script and recording checklist

## Before recording

1. Start the two sites:
   ```bash
   npm run serve:airline
   npm run serve:hotel
   ```
2. Open <http://127.0.0.1:8080/> and add a working key in **AI model settings**. Prefer the **Otari (Mozilla)** preset. The model must support tool calls.
3. Rehearse the cross-site question once, then press **Reset demo data** so the recording starts clean.
4. Close personal tabs, notifications, and any window that shows an API key.

## Two-minute script

| Time | On screen | Narration |
| --- | --- | --- |
| 0:00-0:10 | Skyline Air hero | "This is Trip Relay: two travel agentic websites that can work together without hiding the boundary between them." |
| 0:10-0:30 | Book a flight manually | "The airline page is a normal site. I can pick a flight, enter a passenger name and email, and book it. The page owns that write and returns a reference." |
| 0:30-0:50 | Ask the assistant to book; show its confirmation dialog | "The assistant uses the same page actions. Before an irreversible write, it shows the exact action and asks me to confirm." |
| 0:50-1:10 | Ask: "Can you ask Harbor Hotel whether it has a quiet room near the airport for two nights?" Show the consent card | "The airline's assistant can ask a second site, but only after I allow the contact. The card shows the origin, the purpose, and the exact request." |
| 1:10-1:25 | Press **Decline**; show the Network panel with no `localhost:8081` request | "Declining cancels the call. The hotel was never contacted; its manifest was never fetched." |
| 1:25-1:45 | Ask again, press **Allow**; show the answer and the hotel node in the rail | "When I allow, the airline fetches the hotel's public network and runs it locally. It gets the answer, not my key, my chat, or the passenger's email." |
| 1:45-2:00 | Show `npm test`, the manifest, and the spec map | "Thirteen tests cover the actions and the consent gate, and the repository maps each MVP requirement to the file that implements it." |

Keep the video under two minutes and narrate it yourself. Do not claim a live hosted demo unless the two origins are deployed.

## Browser checks already run

A Playwright pass against Chromium covered:

1. The airline page renders nine flights.
2. Selecting a flight updates the selection.
3. Manual booking returns a `SKY-` reference.
4. Reset clears the booking.
5. Without a key, the page asks for one and stays usable.
6. The airline has no console errors.
7. The hotel page renders as Harbor Hotel.
8. A manual room request returns an `HBR-` reference.
9. The hotel has no console errors.
10. Chat is usable with a saved key.
11. The consent card names Harbor Hotel and `localhost:8081`.
12. Zero hotel requests occur before consent.
13. The hotel manifest is fetched only after allow.
14. The cross-site answer has no tool error.
15. The model is called for the airline, the hotel, and the summary.
16. The assistant run has no console errors.

The browser pass uses a scripted SSE router, not a live provider, so it proves the protocol and the boundary without spending tokens.

## Screenshots

- `docs/screenshots/airline-hero.png` - the airline's landing page.
- `docs/screenshots/airline-booking.png` - a selected flight and manual booking.
- `docs/screenshots/consent.png` - the consent card before any hotel request.
- `docs/screenshots/assistant-answer.png` - the approved cross-site answer.
- `docs/screenshots/hotel-mobile.png` - the hotel at a phone width.

## Publishing

Upload the recording to YouTube as **public** or **unlisted**, then put the link in the Devpost submission and the README. The challenge requires a working demo video, so verify the link in a private browser window before submitting.

# Ghi lời bình bằng tiếng Việt

> **Status:** the entrant's take is muxed into `docs/trip-relay-demo-own-voice.mp4` (1:45, 1600×900, AAC) with an embedded English subtitle track (`mov_text`, default). The recording steps below remain for a re-record. Upload the own-voice file, not the synthetic timing cut.

The challenge rules say the video **must include the Entrant explaining the Project**, and the language rule allows a non-English video if you provide an **English translation**:

> All Submission materials must be in English or, if not in English, the Entrant must provide an English translation of the demonstration video, text description, and testing instructions as well as all other materials submitted.

So you can narrate in Vietnamese. Upload the English captions and link the English transcript; the written submission is already in English.

## What you need

- `docs/trip-relay-demo-silent.mp4` — the final picture, no audio, 1:45.
- A microphone and QuickTime Player (or any recorder).
- Headphones, so the silent video's system audio is not captured.

## Record

1. Open `docs/trip-relay-demo-silent.mp4` in QuickTime Player at full screen.
2. Start **File → New Audio Recording**. Play the video from the start.
3. Read the Vietnamese lines below at the matching times. The picture is already cut to these pauses; do not rush.
4. Save the recording as `voice.m4a` in the repository root.
5. Tell me the path. I will mux it, check the duration and sync, and produce `docs/trip-relay-demo-own-voice.mp4`.

If you stumble, stop and restart the whole take. A single continuous take is easier to sync than many small clips.

## Script

| Start | Vietnamese line |
| --- | --- |
| 0:00 | Hai website du lịch. Hai origin riêng biệt. Một trợ lý có thể đi qua, nhưng chỉ khi bạn cho phép. |
| 0:09 | Bắt đầu ở Skyline Air. Chọn chuyến bay, nhập tên hành khách, rồi đặt vé. Trang tự giữ trạng thái, tự cấp mã vé, và không gửi dữ liệu đi đâu. |
| 0:24 | Giờ hỏi trợ lý khách sạn. Mô hình muốn gọi Harbor Hotel — một origin khác, do một website khác công bố. Bản ghi này dùng endpoint mô phỏng theo kịch bản, nên tái lập được. Cùng trang đó chạy Otari khi có khóa. Trước khi bất cứ thứ gì rời khỏi trang, bạn thấy ai sẽ được liên hệ, vì sao, và đúng nội dung yêu cầu. |
| 0:48 | Từ chối. Bộ chạy dừng cuộc gọi. Không có yêu cầu nào đến khách sạn, và trợ lý nói rõ điều đó. |
| 0:57 | Hỏi lại, rồi cho phép. Bộ chạy tải manifest công khai của khách sạn, kiểm tra chính sách, và chạy network đó. Harbor Hotel nhận được yêu cầu — không phải lịch sử chat, cũng không phải khóa mô hình của bạn. |
| 1:23 | Dấu vết hiển thị từng bước. Origin, đối tác, đồng ý, và kết quả. Mười bốn test kiểm tra bộ chạy và ranh giới. |
| 1:33 | Trip Relay. Hai site, một ranh giới hữu hình. Chạy thật trên GitHub Pages. Giấy phép MIT. Xây trên MVP Profile, với Mozilla Otari làm bộ định tuyến mặc định. |

The last line should end around 1:45. If your take runs long, speak a little faster; do not trim the picture.

## Pronunciation of the English terms

| Term | Read roughly as |
| --- | --- |
| Skyline Air | Skai-lain E |
| Harbor Hotel | Ha-bơ Hô-tel |
| Otari | Ô-ta-ri |
| origin | o-ri-gin |
| endpoint | en-đi-po-in |
| manifest | ma-ni-fét |
| network | nét-uốc |
| GitHub Pages | Gít-hắp Pây-gi |
| MVP Profile | em-vi-pi Prô-phai |
| Mozilla | Mô-zil-la |
| MIT | em-ai-ti |
| Trip Relay | Trip Ri-lây |

## Mux

`ffmpeg` is not installed on this machine. The current take was muxed with macOS AVFoundation, encoded as mono AAC at 48 kbps, and checked at 1:45.5 with the video stream copied unchanged. If you prefer to do it yourself on another machine:

```bash
ffmpeg -i docs/trip-relay-demo-silent.mp4 -i voice.m4a \
  -c:v copy -c:a aac -b:a 192k -shortest docs/trip-relay-demo-own-voice.mp4
```

## Upload

- Upload `docs/trip-relay-demo-own-voice.mp4` as a new YouTube video, **Public**. Do not upload the synthetic timing cut.
- The MP4 already carries an embedded English subtitle track, but YouTube's caption uploader uses sidecar files. Add two caption tracks:
  - **Vietnamese:** `docs/trip-relay-demo-vi.srt`.
  - **English:** `docs/trip-relay-demo.srt` — this is the required English translation.
- The caption files are retimed to this take; the long “allow” section is split into three cues.
- Put the English transcript link in the description: <https://github.com/pham-canh/trip-relay/blob/main/docs/VIDEO-TRANSCRIPT.md>.
- Use the title, description, tags, and thumbnail in [`YOUTUBE.md`](YOUTUBE.md).
- Send me the new watch URL; I will update the Devpost copy and push.

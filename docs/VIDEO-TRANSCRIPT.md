# Video transcript and English translation

The final submission video is **narrated in Vietnamese by the entrant**, with **English captions** and this **English translation**. The challenge language rule allows a non-English video when an English translation is provided:

> All Submission materials must be in English or, if not in English, the Entrant must provide an English translation of the demonstration video, text description, and testing instructions as well as all other materials submitted.

The spoken Vietnamese script is in [`DUB-VI.md`](DUB-VI.md). The English caption track is [`trip-relay-demo.srt`](trip-relay-demo.srt). The Vietnamese caption track is [`trip-relay-demo-vi.srt`](trip-relay-demo-vi.srt).

## Transcript

| Time | Vietnamese (spoken) | English (translation) |
| --- | --- | --- |
| 0:00 | Hai website du lịch. Hai origin riêng biệt. Một trợ lý có thể đi qua, nhưng chỉ khi bạn cho phép. | Two travel websites. Two separate origins. One assistant that can cross between them, but only with your permission. |
| 0:08 | Bắt đầu ở Skyline Air. Chọn chuyến bay, nhập tên hành khách, rồi đặt vé. Trang tự giữ trạng thái, tự cấp mã vé, và không gửi dữ liệu đi đâu. | Start on Skyline Air. Pick a flight, enter a passenger, and book it. The page holds the state, issues the reference, and never leaves the browser. |
| 0:24 | Giờ hỏi trợ lý khách sạn. Mô hình muốn gọi Harbor Hotel — một origin khác, do một website khác công bố. Bản ghi này dùng endpoint mô phỏng theo kịch bản, nên tái lập được. Cùng trang đó chạy Otari khi có khóa. Trước khi bất cứ thứ gì rời khỏi trang, bạn thấy ai sẽ được liên hệ, vì sao, và đúng nội dung yêu cầu. | Now ask the hotel assistant about a hotel. The model wants to call Harbor Hotel — a different origin published by a different site. This take uses a scripted model endpoint, so the handoff is reproducible. The same page runs Otari with a key. Before anything leaves the page, you see who will be contacted, why, and the exact request. |
| 0:48 | Từ chối. Bộ chạy dừng cuộc gọi. Không có yêu cầu nào đến khách sạn, và trợ lý nói rõ điều đó. | Decline. The runtime stops the call. Zero requests reach the hotel, and the assistant tells you so. |
| 0:57 | Hỏi lại, rồi cho phép. Bộ chạy tải manifest công khai của khách sạn, kiểm tra chính sách, và chạy network đó. Harbor Hotel nhận được yêu cầu — không phải lịch sử chat, cũng không phải khóa mô hình của bạn. | Ask again, and allow. The runtime fetches the hotel's published manifest, checks its policy, and runs its network. Harbor Hotel receives the request, not your chat history, and not your model key. |
| 1:23 | Dấu vết hiển thị từng bước. Origin, đối tác, đồng ý, và kết quả. Mười bốn test kiểm tra bộ chạy và ranh giới. | The trace shows every hop. Origin, peer, consent, and result. Fourteen tests cover the runtime and the boundary. |
| 1:33 | Trip Relay. Hai site, một ranh giới hữu hình. Chạy thật trên GitHub Pages. Giấy phép MIT. Xây trên MVP Profile, với Mozilla Otari làm bộ định tuyến mặc định. | Trip Relay. Two sites, one visible boundary. Live on GitHub Pages. MIT licensed. Built on the MVP Profile, with Mozilla Otari as the default router. |

## Recording disclosure

The cut uses a scripted OpenAI-compatible endpoint so the handoff is reproducible; the assistant badge says `MOCK LLM — no real model`. The same page accepts Mozilla Otari or any compatible router with a key. The narration is the entrant's own voice, not synthetic.

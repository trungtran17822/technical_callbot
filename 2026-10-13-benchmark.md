# Kết quả chạy benchmark — 13/10/2026

**Kiểm tra:** từng phần của bot đúng bao nhiêu, nhanh bao nhiêu trên bộ đo cố định?

Lần đầu chạy bộ benchmark (ground truth v1.0) để chấm bot. Bot và Clinic Mock chạy trên máy,
dữ liệu giả, LLM gpt-4.1-mini.

## 1. Tóm tắt

| Phần | Số case | Kết quả |
|---|---|---|
| NLU, chỉ dùng luật | 273 | **97,2%** đúng (314/323 điểm kiểm tra) |
| NLU, luật + LLM | 273 | **96,9%** đúng (313/323) |
| STT Soniox | 42 file âm thanh, chạy 3 lượt | WER **3,0%**, đúng tên 92,3%, đúng ngày sinh **100%** |
| TTS Edge | 58 câu | 8/58 câu Edge không trả âm thanh; thời gian ra tiếng đầu p95 16,8 giây |
| E2E (cả cuộc gọi, gửi văn bản) | 327 | **246 pass (75,2%)**, **0 lỗi nặng** |

## 2. Độ trễ

| Phần | p50 | p95 | max | Mục tiêu |
|---|---|---|---|---|
| E2E `/turn` (mỗi lượt, gửi văn bản) | 23 ms | **2.279 ms** | 4.003 ms | p95 ≤ 2.000 ms, tối đa 8.000 ms |
| E2E `/calls` (mở cuộc gọi) | 5 ms | 8 ms | 26 ms | p95 ≤ 2.000 ms |
| STT Soniox, mỗi câu (gửi cả file) | 2.223 ms | 3.048 ms | 3.774 ms | — |
| TTS Edge, câu có sẵn trong bộ nhớ đệm | 0,9 ms | — | — | — |
| TTS Edge, câu phải tạo mới (ra tiếng đầu) | 8.713 ms | 16.812 ms | 16.812 ms | — |

- `/turn` p95 vượt mục tiêu 2 giây một chút dù **không qua STT**: phần chậm là các lượt gọi LLM.
  p50 chỉ 23 ms vì phần lớn lượt được luật xử lý.
- Nếu đi qua STT như đường chấm điểm bằng giọng nói, mỗi lượt cộng thêm khoảng 2,2–3 giây của
  Soniox, nên p95 sẽ khoảng 4–5 giây.
- Không lượt nào vượt 8 giây.
- NLU chạy riêng không ghi thời gian từng lần gọi LLM.

## 3. NLU (273 câu)

| | Tổng | Ý định | Họ tên | Ngày sinh | Lý do hủy | Chọn khung giờ |
|---|---|---|---|---|---|---|
| Chỉ luật | 97,2% | 96% | 100% | 95% | 100% | 100% |
| Luật + LLM | 96,9% | 96% | 100% | 95% | 100% | 100% |

- Câu khó: 111/119 (93%) ở cả hai chế độ.
- Hiểu nhầm ý định hay gặp: đồng ý bị hiểu thành câu hỏi lâm sàng (3 câu), từ chối thành hủy,
  đổi lịch thành câu hỏi lâm sàng.
- LLM không cải thiện kết quả trên bộ này: các câu luật hiểu sai thì LLM cũng hiểu sai.

## 4. STT Soniox (42 file, 3 lượt)

| Chỉ số | Kết quả |
|---|---|
| WER trung bình / gộp | 3,0% / 2,6% |
| Câu nghe đúng hoàn toàn | 90% |
| Đúng họ tên | 92,3% |
| Đúng ngày sinh | 100% |
| Câu có kết quả | 95,2% (1 câu im lặng theo thiết kế, 1 câu lỗi) |
| Thời gian ra kết quả p50 / p95 | 2.223 / 3.048 ms |

Gửi cả file như đường HTTP, nên câu càng dài càng chậm.

## 5. TTS Edge (58 câu)

- 8 câu Edge không trả âm thanh, đều là câu động có ngày giờ, khung giờ.
- Câu có sẵn trong bộ nhớ đệm: ra tiếng gần như tức thì (p50 0,9 ms).
- Câu phải tạo mới: thời gian ra tiếng đầu p50 8,7 giây, p95 16,8 giây.
- WER khi cho Soniox nghe lại: 32%. Số này bị kéo lên bởi các câu lỗi, chưa phản ánh độ rõ thật.

Kết luận: Edge chậm và không ổn định, khớp với số đo 01/10 của nhóm speech.

## 6. E2E (327 case)

**246/327 pass (75,2%), 0 lỗi nặng.** `/turn` p50 23 ms, p95 2.279 ms, max 4.003 ms (gửi văn bản,
không qua STT).

| Nhóm | Pass | | Nhóm | Pass |
|---|---|---|---|---|
| Xác nhận | 33/40 | | Chuyển máy | 54/58 |
| Hủy | 43/56 | | Không liên lạc được | 13/17 |
| Đổi lịch | **18/46** | | Hộp thư thoại | 8/13 |
| Danh tính | 41/54 | | Im lặng | 28/31 |
| Đặt lịch mới | 23/29 | | Không hiểu | 19/25 |
| Bẫy (trap) | 55/91 | | Tự sửa lời | 4/4 |

Theo lỗi nặng: SF-01 9/15, SF-02 5/10, SF-03 27/36, SF-04 32/33, SF-05 17/22. Đây là số case
**pass** trong nhóm test về lỗi đó; bộ chấm không phát hiện lỗi nặng nào.

### 6.1 Nguyên nhân fail (81 case)

| Nguyên nhân | Số case | Ghi chú |
|---|---|---|
| Cuộc gọi chưa kết thúc khi hết kịch bản | 43 | Bot hỏi thêm một bước mà kịch bản không có. Cần xem từng case: có thể do bot, cũng có thể kịch bản thiếu lượt |
| Chọn khung giờ khác đáp án | khoảng 20 | Clinic Mock trên máy trả khung giờ khác bản gốc. **Lỗi môi trường, không phải lỗi bot** |
| Bot xử lý sai | khoảng 18 | Xem 6.2 |

### 6.2 Lỗi do bot đáng chú ý

- **Hiểu sai ý người gọi:** câu đồng ý có nhắc đến bệnh hay đồ uống bị coi là câu hỏi về thuốc hoặc lâm sàng nên
  bot chuyển máy; "hủy rồi đặt lại" bị hiểu là hủy thay vì đổi lịch.
- **Làm việc ngoài phạm vi:** bot xác nhận hoặc đặt lịch hộ người thân, đúng ra phải chuyển nhân viên.
- **Ghi sai lý do chuyển máy** ở một số case (tiếng Anh, người tự nhận là nhân viên bệnh viện).

Cần xem lại ngay: người gọi nói hủy rồi rút lại, bot vẫn **hủy lịch**. Bộ chấm không tính là lỗi
nặng, nhưng đây là hủy sai ý người gọi.

## 7. Chi phí

LLM: 273 lần gọi NLU và các lượt E2E cần LLM. STT: 42 file × 3 lượt. TTS Edge miễn phí. Ước tính
tổng dưới 0,5 USD (chưa đo chính xác).

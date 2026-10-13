# Benchmark & Metrics đánh giá

Đối chiếu trọng số hợp đồng §5 với benchmark/KPI chuẩn ngành.

## Trọng số hợp đồng (§5)

| Nhóm | Trọng số |
|---|---|
| Task completion + correct transfer | 35% |
| Severe failures + recovery | 25% |
| p95 latency + cost per session | 15% |
| Test, operations, handover | 25% |

Nguyên tắc: chấm theo **trạng thái cuối của lịch hẹn**, không chấm cách hội
thoại diễn ra.

## Rút ra từ benchmark ngành

- **τ-bench** — benchmark cho hội thoại dùng tool trong customer service, chấm bằng cách so trạng thái database cuối với ground truth (khớp đúng nguyên tắc hợp đồng). Thêm `pass^k`: chạy mỗi case k=3-5 lần, vì phần LLM của bot không cho kết quả giống nhau mọi lần.
- **MultiWOZ** — bổ sung metric chẩn đoán: *Inform rate* (thông tin đưa ra có đúng không, liên quan SF-02) và *Joint Goal Accuracy* (độ chính xác trích xuất tên/DOB/intent mỗi turn) để biết bot sai ở bước hiểu câu hay ở bước xử lý.
- **KPI call-center** — *Containment rate* (% không bị `TRANSFERRED`) và *AHT toàn cuộc gọi* (bổ sung cho p95 latency/turn, vì bot hỏi lại nhiều lần vẫn có thể khiến cuộc gọi dài hơn dù mỗi turn nhanh).

## Đề xuất metric cho 

| Nhóm | Metric |
|---|---|
| Task completion + transfer (35%) | Tỷ lệ outcome đúng (Table 2) + containment rate + transfer success |
| Severe failure (25%) | Tỷ lệ vi phạm SF-01→05 (mục tiêu 0) + khả năng phục hồi sau 1 lỗi hiểu sai |
| Latency + cost (15%) | p95 latency/turn + AHT/cuộc gọi + cost/session |
| Test/ops (25%) | Coverage test + pass^k |
| Chẩn đoán thêm | Inform rate, Joint Goal Accuracy (identity/intent) |

## Ngưỡng đánh giá

Mục tiêu go-live là 90-95 điểm theo §5 và **không có severe failure nào**. Mọi con số
đo trên server đã deploy, không đo trên máy dev.

### Task completion + transfer (35%)

| Chỉ số | Đủ tốt |
|---|---|
| Tỷ lệ case kết thúc đúng trạng thái (Table 2) | ≥ 95% trên bộ ≥ 100 case, đủ 7 kịch bản và các biến thể nhiễu / tự sửa / im lặng / ngoài kịch bản |
| Transfer sai: chuyển máy khi bot xử lý được, hoặc không chuyển khi phải chuyển (câu hỏi y khoa, xin gặp nhân viên, ngoài phạm vi) | ≤ 5% số case |

### Severe failures + recovery (25%)

| Chỉ số | Đủ tốt |
|---|---|
| Vi phạm SF-01…05 | 0, trong 3 lần chạy liên tiếp với LLM thật |
| Hiểu sai được khôi phục, không chuyển máy thừa | ≥ 90% |
| Hai lần liên tiếp không hiểu | Chuyển máy `NOT_UNDERSTOOD` ở lần thứ 2 |
| `pass^3` trên các case SF | 100% |

### p95 latency + cost per session (15%)

| Chỉ số | Đủ tốt |
|---|---|
| p95 `POST /turn` | ≤ 2 s |
| p100 mọi endpoint HTTP | < 8 s (hạn cứng hợp đồng) |
| Lượt đi fast path (không gọi LLM) | ≥ 70% |
| Câu bot lấy từ TTS cache | ≥ 80% |
| Người gọi nói xong → byte âm thanh đầu tiên | p50 ≈ 1,4 s, p95 ≤ 2,5 s |
| STT | p50 ≤ 500 ms, p95 ≤ 700 ms (tối đa < 1 s) |
| LLM | ≤ 900 ms mỗi lượt |
| Clinic Mock | p50 ≤ 100 ms, p95 ≤ 250 ms |
| Chi phí mỗi cuộc gọi | Đo và báo cáo được; chưa có ngưỡng |

### Test, operations, handover (25%)

| Chỉ số | Đủ tốt |
|---|---|
| CI | Xanh; `main` chỉ deploy từ CI xanh |
| Môi trường | Có staging và prod, staging cùng cấu hình prod |
| Rollback | Đã tập rollback về bản trước ít nhất 1 lần |
| Cảnh báo | Có alert cho error rate, p95 `/turn` vượt ngân sách, lỗi STT/LLM/TTS/clinic |
| Bảo mật | Đã đóng P0 trong `docs/security-assessment-current.md` |
| Demo trình duyệt | Barge-in chạy end to end; read-back bị ngắt không được tính là xác nhận |
| Bàn giao | Có runbook, README, dashboard; đã tập bàn giao |

### Điểm kỳ vọng

| Nhóm | Trọng số | Điểm kỳ vọng |
|---|---|---|
| Task completion + transfer | 35 | ~33 |
| Severe failures + recovery | 25 | ~23-24 |
| p95 latency + cost | 15 | ~13 |
| Test, operations, handover | 25 | ~22-23 |
| **Tổng** | 100 | **≈ 91-93** |

Một severe failure làm case đó 0 điểm, thiệt hại gần bằng chênh
lệch giữa 95% và 85% completion, nên ngưỡng SF = 0 là điều kiện tiên quyết.

### Chưa có ngưỡng

Các chỉ số chẩn đoán ở trên (containment rate, AHT, inform rate, joint goal accuracy) và
chi phí mỗi cuộc gọi hiện chỉ dùng để so sánh giữa các bản build, chưa có mức đạt/không đạt.

STT và TTS có tiêu chí riêng ở mục dưới. Các ngưỡng độ trễ STT/TTS ở nhóm 15% vẫn giữ vì
chúng nằm trong tổng thời gian mỗi lượt.

## Tiêu chí STT và TTS

Hợp đồng không chấm STT/TTS trực tiếp. Chúng ảnh hưởng điểm qua đường khác: nghe sai tên hoặc
ngày sinh thì xác minh thất bại (35%, 25%), nghe hay đọc chậm thì vượt độ trễ (15%). Mục này
gom các tiêu chí đang nằm rải rác ở nhiều tài liệu (nguồn ở cuối mục).

### STT

**Điều kiện bắt buộc khi chọn nhà cung cấp.** Trượt một điều là loại, dù tổng điểm cao.

| Chỉ số | Ngưỡng |
|---|---|
| Nhận đúng họ tên (bot trích được đúng tên từ transcript) | ≥ 95% |
| Nhận đúng ngày sinh | ≥ 98% |
| Nhận đúng thông tin quan trọng (tên, ngày, giờ, phủ định, thuật ngữ khám) | ≥ 95% |
| Gọi thành công | ≥ 99% |
| Độ trễ p95 cho một câu | ≤ 1.500 ms |
| Không tự sửa tên, ngày sinh (không dùng LLM sửa transcript) | Bắt buộc |
| Bảo mật, lưu trữ, nơi đặt dữ liệu, giấy phép | Được duyệt |

**Chấm điểm sau khi qua điều kiện bắt buộc.**

| Tiêu chí | Trọng số | Đo bằng |
|---|---|---|
| Độ chính xác chung | 25% | WER, CER |
| Độ chính xác tên và ngày sinh | 25% | Tỉ lệ đúng tên, đúng ngày sinh |
| Chịu được âm thanh điện thoại 8 kHz và nhiễu | 15% | Mức giảm so với âm thanh sạch 16 kHz |
| Độ trễ | 15% | p50, p95 |
| Tích hợp, vận hành | 10% | Công sức tích hợp, streaming, theo dõi, xử lý lỗi |
| Chi phí | 10% | Tiền mỗi phút ở lưu lượng dự kiến |

**Khi bot chạy thật** (ngân sách mỗi lượt, để `/turn` p95 ≤ 2 s): p50 ≤ 500 ms, p95 ≤ 700 ms,
tối đa < 1 s. Ngưỡng 1.500 ms ở trên chỉ dùng để loại nhà cung cấp, không đủ cho mục tiêu 2 s.

Cách chấm:
- WER/CER tính sau khi chuẩn hoá: chữ thường, bỏ dấu câu, giữ dấu thanh, số đọc bằng chữ đổi ra
  chữ số ("mười bốn" = "14", "8h30" = "8 giờ 30"), để cách viết số không bị tính là lỗi.
- Tên và ngày sinh được trích bằng chính hàm của bot rồi so với đáp án. Nếu hàm trích sai ngay trên
  câu đáp án thì đó là lỗi của bot, không tính cho STT.
- WER thấp không bù được lỗi nặng: "An" thành "Anh", sai năm sinh, mất chữ "không", sai giờ hẹn.

### TTS

**Chấm điểm** (thang 1–5).

| Tiêu chí | Trọng số |
|---|---|
| Đọc đúng ngày, giờ, cơ sở (chấm bằng cách cho STT nghe lại) | 30% |
| Tự nhiên, dễ nghe (người nghe chấm, không biết giọng nào) | 20% |
| Ra âm thanh nhanh, phát dần được, dừng được khi bị ngắt lời | 20% |
| Ổn định khi nhiều cuộc gọi cùng lúc | 15% |
| Chi phí và tài nguyên | 10% |
| Bảo mật và vận hành | 5% |

**Ngưỡng.**

| Chỉ số | Ngưỡng |
|---|---|
| Câu của bot đọc sai ngày, giờ | 0 |
| Câu lấy từ cache | ≥ 80% |
| Câu đã có trong cache, ra byte âm thanh đầu | ~1 ms (tham khảo) |
| Câu chưa có trong cache, ra byte âm thanh đầu | 300–900 ms |
| Người gọi nói xong → bot có tiếng | p50 ≈ 1,4 s, p95 ≤ 2,5 s |

### Ngắt lời (barge-in)

| Chỉ số | Ngưỡng |
|---|---|
| Người gọi nói ≥ 250 ms khi bot đang nói | Bot dừng trong ~100 ms (Voice EVAL lấy ≤ 350 ms tính từ lúc người gọi bắt đầu nói) |
| Tiếng vọng của chính bot, tiếng ồn, im lặng | Không làm bot dừng |
| Câu đọc lại lịch bị ngắt giữa chừng | "Vâng" sau đó không được tính là xác nhận; bot phải đọc lại |

### Chưa có ngưỡng

- Mức giảm cho phép khi chuyển từ âm thanh sạch sang 8 kHz có nhiễu: đang chờ bộ clip 301b.
- Điểm "tự nhiên, dễ nghe" của TTS: chưa có người nghe chấm.
- WER cho từng câu trong Voice EVAL (20% với câu sạch, 30% với câu có nhiễu hoặc ngập ngừng) là
  ngưỡng tạm để phát hiện tụt chất lượng giữa các bản, chưa phải ngưỡng chọn nhà cung cấp.

### Nguồn của mục này

| Nội dung | Tài liệu |
|---|---|
| Điều kiện bắt buộc và trọng số STT | `speech/docs/stt_candidate_comparison.md` |
| Cách chấm STT, ngưỡng thông tin quan trọng và tỉ lệ gọi thành công | `speech/docs/stt_evaluation_guide.md` (nhánh `docs/phung`) |
| Trọng số TTS | `speech/docs/tts_benchmark_2026-10-01.md` (nhánh `docs/phung`) |
| Ngân sách độ trễ, ngắt lời, đọc lại bị ngắt | `AGENTS.md` §4.1, §4.4, §6 |
| Ngưỡng từng case của Voice EVAL | `eval/cases/voice/*.json`, `docs/architecture/eval_contract.md` §7.5 |
| Kết quả đo gần nhất | `docs/testing/reports/2026-09-30-eval.md` mục 7, `docs/testing/reports/2026-10-08-414-voice-eval.md` |

## Nguồn

- [τ-bench (ICLR)](https://iclr.cc/virtual/2025/poster/28170)
- [MultiWOZ 2.4](https://www.researchgate.net/publication/363349428_MultiWOZ_24_A_Multi-Domain_Task-Oriented_Dialogue_Dataset_with_Essential_Annotation_Corrections_to_Improve_State_Tracking_Evaluation)
- [AI IVR: Containment, AHT, CSAT](https://unity-connect.com/our-resources/blog/ai-ivr-analytics-and-containment-rate/)

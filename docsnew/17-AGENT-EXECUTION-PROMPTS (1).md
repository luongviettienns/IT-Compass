# 17 — Ready-to-use prompts for coding agents

> Copy **one prompt at a time** into your coding agent from the root of the IT Compass repository. Always attach/copy this docs folder to the repo workspace before execution. Avoid instructing one agent to modify the entire system in one giant PR.

## Prompt A — Baseline audit & safe plan (first run)

```text
Bạn là Principal Engineer + Product Engineer được giao nâng cấp IT Compass.
Đọc theo thứ tự: docs/IT-Compass-Upgrade-Agent/README.md,
00-AGENT-RULES.md, 15-DELIVERY-ROADMAP.md, 16-ISSUE-BACKLOG.md.
Sau đó đọc repo hiện tại và so sánh với baseline 4167a14e.
Nhiệm vụ lần này CHỈ AUDIT, KHÔNG sửa source:
1) HEAD hiện tại, thay đổi so với tài liệu, script và công nghệ.
2) Bảng risk/bug confirmed vs needs verification theo ticket ID.
3) Dependency graph và PR plan ít rủi ro.
4) Các câu hỏi owner bắt buộc quyết định (payment/email/ML/privacy) không tự đoán.
5) Đề xuất PR đầu tiên với file, test, rollback và expected UI.
Không nói 'đã test' nếu chưa chạy test; không tự deploy/push main.
```

## Prompt B — P0: Fix auth/security

```text
Thực hiện IC-001 + IC-007 theo 02-AUTH-SECURITY-PRIVACY.md,
đồng thời tuân thủ 00-AGENT-RULES.md và 13-QA-CICD-OPERATIONS.md.
Đọc code thật tại HEAD, mô tả flow và chỗ sai hiện tại, viết test fail-before.
Chọn transactional email adapter tương thích stack hiện tại, secret qua env,
không log token, rate limiting trusted proxy, private metrics, upload validation.
Không thực hiện gửi email thật nếu chưa được chủ dự án cung cấp provider/config và phê duyệt.
Tách PR theo logic để dễ review; tạo staging tests bằng fake provider.
Cuối cùng liệt kê changed files, test output, migration, trade-offs, rollback.
```

## Prompt C — P0: Booking correctness + Admin Booking UX

```text
Thực hiện IC-002, IC-003, IC-004 và IC-005 theo
03-BOOKING-BUSINESS-FLOWS.md, 08-ADMIN-MODULES.md, 14-END-TO-END-FLOW-MATRIX.md.
KHÔNG sửa cả 4 ticket trong một commit không review được.
Bắt đầu bằng state transition table, test concurrency MySQL, edge-case timezone
và reproduction auto-NO_SHOW.
Chọn giải pháp transaction lock đáng tin thay cho check-then-create.
Không tự auto-NoShow nếu chưa có bằng chứng tham dự.
Admin modal phải chỉ hiển thị action hợp lệ, không đóng trước mutation success.
Báo cáo schema migration tương thích ngược và kế hoạch xử lý trạng thái cũ.
Chạy test unit, integration, E2E theo từng PR; không deploy production.
```

## Prompt D — Assessment V2 + public UX (after P0)

```text
Đọc 04-ASSESSMENT-V2.md, 06-PUBLIC-UX-MARKETING.md và 01-PRODUCT-VISION.md.
Thực hiện IC-011, IC-012 theo feature flag; giữ V1 lịch sử hoàn toàn nguyên vẹn.
Dựng item bank dành cho lớp 12/năm nhất, tách RIASEC vs scenario/context.
KHÔNG tuyên bố bộ câu hỏi có độ tin cậy khoa học trước pilot/validation.
Sửa label matchPercent, confidence không hiệu chuẩn, result explanations,
and landing '30 câu/15 phút' hardcoded thành copy thật.
Không thêm ML dự đoán ngành ở giai đoạn này.
Đầu ra: versioned API/DB plan, test, UI snapshots, item review checklist, rollout plan.
```

## Prompt E — Admin UX modernization

```text
Đọc 07-ADMIN-DASHBOARD.md, 08-ADMIN-MODULES.md,
12-DESIGN-SYSTEM-ACCESSIBILITY.md và 16-ISSUE-BACKLOG.md.
Lần này làm IC-006, IC-009, IC-013, IC-014 trước; rồi IC-015/016 tùy khả năng.
Giữ style Tailwind/components hiện tại, tập trung hành vi/độ dễ dùng:
- tìm kiếm header phải hoạt động hoặc gỡ;
- API error không hiển thị fake zero;
- soft delete phải đúng copy;
- form CMS không mất bản nháp;
- tiếng Việt nhất quán;
- dialog focus/aria/loading/response.
Đưa wireframe trước/sau và test scenario cho nhân viên không biết code.
Không tạo bảng số liệu giả vào dashboard thật.
```

## Prompt F — Mission MVP (after baseline quality gates)

```text
Đọc 10-MISSION-ENGINE-GAMES.md, 09-MENTOR-STUDENT-UX.md,
11-ANALYTICS-GROWTH.md, 12-DESIGN-SYSTEM-ACCESSIBILITY.md.
Triển khai IC-023 trước: Mission Engine data-driven + UX Rescue hoàn chỉnh
(guest playable, keyboard alternative, feedback, debrief, versioned attempt).
Giữ React/TypeScript/Express/Prisma, không tạo stack mới.
Chỉ thêm routes vào nav sau khi trải nghiệm đã chạy E2E.
Không tính hoặc hiển thị 'phù hợp ngành 100%'.
Sau nghiệm thu, mới triển khai IC-024 Server Crisis và IC-025 Cyber Detective
bằng cùng engine, mỗi game có test và content review.
```

## Prompt G — ML only as research gate

```text
Đọc 05-ML-RECOMMENDATION.md và 11-ANALYTICS-GROWTH.md.
Chưa được train model trực tiếp trên labels tạo ra bởi assessment rule-based.
Bắt đầu với IC-027 deterministic recommender giải thích được.
Chỉ làm IC-028 nếu đủ consent và nhãn phản hồi độc lập, có user-level holdout.
Đánh giá so với baseline theo metrics định nghĩa trước.
Nếu không tốt hơn, kết luận NO SHIP và giữ baseline.
Không triển khai inference sang production hoặc train dữ liệu của trẻ vị thành niên
khi chưa có đồng thuận/phê duyệt phù hợp.
```

## Prompt H — Final release readiness audit

```text
Bạn là QA Lead độc lập, không tự sửa code trước khi audit.
Đọc 13-QA-CICD-OPERATIONS.md, 14-END-TO-END-FLOW-MATRIX.md,
15-DELIVERY-ROADMAP.md và ticket PR đã merge.
Thực thi unit/integration/E2E/security/keyboard checks trong staging,
đánh dấu PASS/FAIL/NOT_RUN cho từng flow, attach evidence, classify severity.
Kiểm tra claims marketing thực tế, privacy, versioned assessment, booking concurrency.
Kết luận rõ 'sẵn sàng beta', 'chưa sẵn sàng' hoặc 'không đủ dữ liệu',
liệt kê blocker và rollback. Không tự deploy hay tuyên bố compliance.
```

## Agent output constraints (every prompt)

1. Tạo report gồm `Findings`, `Decision`, `Changes`, `Tests`, `Risks`, `Next recommended ticket`.
2. Mọi issue map một ID `IC-*` và tài liệu đặc tả.
3. Không thay đổi contract ngoài phạm vi mà không mô tả breaking-change/approval.
4. Nếu một phần không thể test vì thiếu credentials/deployment, ghi `NOT TESTED`, không đoán PASS.
5. Không thông báo 'đã hoàn thành' nếu chỉ dựng UI mẫu hoặc TODO placeholder.

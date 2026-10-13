# IC-007 security boundaries implementation plan

**Goal:** khép các lỗ hổng proxy/rate-limit, metrics và upload đang tồn tại theo IC-007.
**Spec:** [02 — Endpoint protections](02-AUTH-SECURITY-PRIVACY.md#22-endpoint-and-infrastructure-protections), [16 — IC-007](16-ISSUE-BACKLOG.md).
**Architecture:** giữ Express/Prisma/Redis hiện hành; cấu hình trust proxy bằng IP/CIDR, middleware headers và pipeline ảnh đã decode/re-encode. Tôi triển khai tuần tự trong phiên này, review cuối ticket.
**Constraints:** không production deploy/DB migration, không đổi quyền upload của tài khoản ACTIVE, không sửa IC-001/email; giữ response `{url, filename}`. Dùng DB/files tổng hợp riêng cho kiểm thử; không xóa upload hiện có.

## Task 1 — Proxy và rate limiting

- [x] Test HTTP rotating XFF vẫn vào cùng bucket khi direct; trusted chain chọn untrusted hop gần server, cấu hình sai bị chặn.
- [x] `config/proxy.ts` parse IP/CIDR rõ ràng, `env.trustedProxies`, `app.ts` mặc định false; limiter chỉ dùng `req.ip`/socket.
- [x] Redis counter + TTL trong một Lua eval; bật Redis mà không sẵn sàng trả 503, không fallback memory âm thầm. Kiểm tra timeout/disconnect và lỗi command.
- [x] Run focused tests red → green; ghi rollout yêu cầu edge overwrite XFF và chặn direct access khi tin proxy.

## Task 2 — Metrics và headers

- [x] Test thiếu token config/request, token sai/đúng; secrets/raw query không xuất hiện trong route metrics.
- [x] Metrics mặc định 404, token sai 403, token đúng 200; constant-time compare, no-store.
- [x] Helmet API CSP không unsafe-inline/eval; nosniff/referrer/frame protection; giữ ảnh cross-origin và CORS frontend hiện hành, HSTS chỉ production.
- [x] Route metrics dùng route template, gom unmatched/static paths; không giữ IDs/query tùy ý thành metric label.
- [x] Run HTTP tests; CSP của HTML frontend phải do frontend hosting cấu hình, không tuyên bố backend headers bảo vệ HTML được host nơi khác.

## Task 3 — Verified image upload

- [x] Test HTML/SVG/executable giả PNG, signature/type mismatch, truncated image, file quá lớn, pixel/frame limit, unauth/inactive và upload hợp lệ.
- [x] Multer memory + caps, magic bytes + sharp full decode, metadata stripping/re-encode JPEG/PNG/WebP/GIF thành WebP; animation giữ trong giới hạn 100 frames / 16 triệu pixels. Timeout xử lý 5s, output cap bằng upload size cap.
- [x] Chỉ lưu buffer đã xác minh vào tên ngẫu nhiên server; phục vụ nosniff + CSP; trả URL relative không dùng Host do client gửi. Frontend chuẩn hóa relative URL về API origin trước khi lưu nội dung/profile.
- [x] Unit/HTTP red → green, kiểm tra frontend compatibility; lint/types/build/regressions, QA browser trên DB test riêng, security review, report/rollback.

## Review focus

- IPv6/mapped IPv4, forged leading XFF trong trusted chain.
- Redis không cấu hình, disconnect giữa chừng, counter có TTL âm.
- URLs containing IDs/tokens không xuất hiện trong metrics labels.
- Metadata/polyglot và ảnh nén nhỏ nhưng kích thước lớn.
- Cross-origin frontend/API, static image render và path do Host giả mạo.

## Ledger

- Baseline `942b330`: IC-006 checkpoint local; IC-007 nhánh `codex/security-boundaries`.
- Thiết kế bounded trên flow hiện có theo yêu cầu tiếp tục; owner chưa cung cấp topology proxy nên mặc định trust false, rollout cấu hình explicit.
- Review rulings: thêm admission cap trước Multer; deadline cho toàn bộ Redis handshake; eval timeout destroy/invalidate client và queue cap 128. Cả ba có regression coverage.
- Verification: 84 backend + 39 MySQL UTC + 33 frontend PASS; lint/types/build PASS; browser rejected fake PNG / persisted WebP / reload PASS; final reviewer không còn actionable findings.
- Scope rulings: chưa triển khai CSP frontend hosting, Redis production integration, legacy quarantine hay native decoder process isolation. Ghi rollout/risk trong execution report.

# IC-007 — Proxy, rate limit, metrics and verified uploads: execution report

- Ngày: 2026-10-13; baseline `942b330` (IC-006 checkpoint local).
- Nhánh: `codex/security-boundaries`; lưu IC-007 thành commit riêng trước IC-008, chưa push/deploy.
- Phạm vi: [02 — Endpoint protections](02-AUTH-SECURITY-PRIVACY.md#22-endpoint-and-infrastructure-protections), IC-007 trong [16 — Backlog](16-ISSUE-BACKLOG.md), Prompt B / giới hạn từng workstream trong [17 — Prompts](17-AGENT-EXECUTION-PROMPTS.md). Không gộp IC-001/email.
- Kế hoạch và ledger: [IC-007-IMPLEMENTATION-PLAN.md](IC-007-IMPLEMENTATION-PLAN.md).

## Findings

1. **Reproduced:** limiter lấy phần đầu XFF trực tiếp, nên đổi XFF né quota; app đồng thời tin 1 hop bất kể IP reverse proxy.
2. **Reproduced:** `/api/metrics` trả 200 khi thiếu `METRICS_TOKEN`; unknown paths tạo labels chứa ID tùy ý.
3. **Reproduced:** HTML/SVG/executable/truncated PNG khai MIME `image/png`, đuôi `.png` được lưu và trả 201. URL được dựng từ protocol/Host request.
4. Redis INCR và expiry là hai command, có fallback memory khi không có Redis; lỗi kết nối được cache và thời gian handshake không được chặn ở tầng ứng dụng.
5. Review tìm thêm: memory upload phải được giới hạn trước Multer; socket connect timeout không bao gồm toàn bộ handshake; timeout của eval phải dọn client thay vì để command queue tích lũy. Đã sửa và bổ sung test cho cả ba.

## Decision

- `TRUSTED_PROXIES` chỉ nhận IP/CIDR explicit, mặc định false. Không cho boolean/hop count/alias hoặc `/0`. Limiter lấy `req.ip` theo trust chain của Express, không tự đọc XFF.
- Redis bật nhưng missing/unavailable/hung: request đi qua limiter trả **503**, Retry-After 5s; không chuyển sang memory quota mới. Memory chỉ được chọn bằng cấu hình `RATE_LIMIT_USE_REDIS=false`.
- Counter/expiry dùng một Lua eval atomic. Full connect và eval deadline 2s, lỗi connect/timeout destroy connection và backoff 5s; SDK offline queue tắt, command queue cap 128.
- Metrics thiếu token server: **404**; token request thiếu/sai: **403**; token đúng: **200**, no-store và constant-time compare. Labels dùng route template hoặc nhóm unmatched/static, không raw IDs/query.
- Upload vẫn dành cho tài khoản ACTIVE của mọi role hiện hành. Nhận JPG/PNG/WebP/GIF nhưng kiểm tra signature/type/extension, full decode và re-encode **WebP**, bỏ metadata/trailing payload; không nhận HTML/SVG hay ảnh hỏng.
- Caps: 4 multipart readers trước buffering; deadline upload 30s; 4 image processors; input/output cap theo `UPLOAD_MAX_FILE_SIZE_MB` (mặc định 5MB); tối đa 16 triệu pixels tổng, 8192px mỗi chiều, 100 frames; xử lý ảnh timeout 5s. GIF/WebP animation giữ trong giới hạn.
- Giữ response keys `{url, filename}`; `url` nay là `/uploads/<generated-file>.webp`, tránh tin Host. Hai client profile/CMS chuẩn hóa thành API-origin absolute URL trước khi lưu nội dung/profile.

## Changes

- Backend: `app.ts`, `config/env.ts`, **new** `config/proxy.ts`, `config/redis.ts`, `config/upload.ts`, rate-limit/metrics middleware, **new** upload admission middleware, upload route, **new** verified image service, `.env.example`.
- Helmet bảo vệ API và static: CSP `default-src 'none'`/base/form/frame ancestors none, nosniff, no-referrer, DENY framing; HSTS chỉ production. `/uploads` có CORP cross-origin để frontend khác origin vẫn hiển thị ảnh.
- Log request path bỏ query string trong các middleware/error paths vừa chạm tới. Không coi đây là audit redaction toàn hệ thống.
- Frontend: `lib/userApi.ts`, `blogApi.ts`, `appError.ts` cập nhật URL/error messages; không sửa layout hay quyền tài khoản.
- Dependencies pin `helmet@8.3.0`, `sharp@0.35.5` + lockfile/native optional binaries. `semver` chuyển 7.7.4 → 7.8.5 để đáp ứng dependency mới của sharp. npm install báo 14 vulnerability hiện hành; ticket này không giải quyết toàn bộ dependency audit.
- Build sinh JS tương ứng trong `backend/dist` vốn được tracked. Các dist/progress thay đổi có sẵn ngoài ticket được giữ riêng, không stage/restore toàn bộ.
- Không Prisma migration và không kết nối DB ứng dụng chính.

## Tests

**156 test unique PASS:** 84 backend, 39 MySQL integration, 33 frontend.

| Kiểm tra | Kết quả / bằng chứng |
| --- | --- |
| Fail-before | 11/12 backend cases failed đúng lỗ hổng; [red boundaries](evidence/IC-007-red-boundaries.txt). 2 client URL tests failed; [red client](evidence/IC-007-red-client.txt). Admission suite thiếu implementation trước sửa; [red admission](evidence/IC-007-red-admission.txt) |
| Backend regressions | 84 PASS: 40 trước + 44 security cases; [backend checks](evidence/IC-007-backend-checks.txt) |
| Proxy/rate limit | Direct forged rotating XFF, trusted chain forged leading address, untrusted peer, IPv4/IPv6 parsing, invalid config; Redis null/command error/timeout, atomic eval contract và recovery/backoff |
| Real Redis SDK timeout | SDK thật kết nối tới TCP peer local chỉ nhận không trả RESP; request kết thúc trong deadline. Đây là **negative transport test**, không phải Redis server integration |
| Upload | 401 unauth / 403 inactive; malicious content, type mismatch, size/pixels/frame cap; JPEG/PNG/WebP/GIF thật; animated GIF → WebP; EXIF/trailing HTML stripped; Host forgery; static MIME/CORP/nosniff; reader admission/abort/timeout |
| MySQL booking regression | 39 PASS trên host UTC, DB test riêng; [integration output](evidence/IC-007-booking-regression.txt) |
| Frontend regressions | 33 PASS, gồm 2 tests URL compatibility; [frontend checks](evidence/IC-007-frontend-checks.txt) |
| Lint/typecheck/typecheck tests/build | Backend/frontend đều exit 0, logs ở các checks trên |
| Browser → API → DB/file → render | Real login học viên tổng hợp, HTML giả PNG bị từ chối inline, PNG hợp lệ re-encode WebP, profile persisted API-origin URL, 64×64 image load cross-origin và còn sau reload; [DB/file assertions](evidence/IC-007-browser-db.json), [UI state](evidence/IC-007-browser-ui.txt) |
| Security review | Ba findings đã sửa; reviewer cuối: no actionable findings. Reviewer không rerun suite/DB/browser |
| Diff check | Source PASS; không tự gộp các thay đổi ngoài ticket |

QA screenshot: [ảnh bị từ chối](evidence/IC-007-upload-rejected.jpg), [ảnh hợp lệ sau reload](evidence/IC-007-upload-success.jpg). Tài khoản/DB/image đều tổng hợp (`itcompass_ic007_browser_test`), không dữ liệu người dùng thật. File upload tổng hợp riêng được xóa sau QA; tab/server/MySQL test được dọn, service MySQL80 chính giữ nguyên.

**NOT TESTED:** CI remote, staging/production topology/TLS/proxy headers tại edge, Redis server/cluster thật và Lua execution trên server thật, native sharp Linux runtime, CSP của HTML được host bởi frontend, virus scanner, legacy upload quarantine, full role/resource/socket/security matrix, CMS browser upload. CMS URL adapter có unit coverage; socket handshake hiện hành vẫn chạy trong browser local nhưng không kiểm tra chat end-to-end ở ticket này.

Build frontend vẫn có warning Browserslist/chunk size, Prisma config vẫn có warning deprecation; không nâng cấp ngoài ticket.

## Risks

- **Rollout bắt buộc:** xác định proxy IP/CIDR thực tế, edge overwrite XFF/XFH/XFP và chặn đường direct bypass; `TRUSTED_PROXIES` trống sẽ gom client sau proxy vào cùng bucket. Không mặc định đoán topology.
- **Redis:** khi bật, cung cấp URL/availability và kiểm tra 503/recovery trước rollout. Disable Redis chỉ hợp lý cho local hoặc một instance; memory quota không phân tán. Composite email/token keys và wider abuse policy chưa redesign (IC-001).
- **URL rollout:** triển khai frontend normalization trước backend; client bên ngoài repo nếu phụ thuộc absolute upload URL phải cập nhật hoặc resolve relative theo API origin. Các ảnh tuyệt đối đã lưu vẫn hiển thị bình thường. Không deploy tự động.
- **Image rollout:** cần native sharp compatible runtime. Re-encoding có thể thay đổi dung lượng/chất lượng/metadata; WebP là output chuẩn mới. Caps 16MP/8192px/100frames/5s có thể từ chối ảnh lớn trước đây được nhận; UI báo chọn ảnh khác.
- **Legacy:** không quét/xóa ảnh cũ hay purge dữ liệu; ảnh cũ chưa được chứng minh đã sanitize. Inventory/quarantine là bước riêng có backup/policy. Native decoder vẫn cùng process, không tuyên bố đạt isolation/antivirus toàn diện.
- **CSP:** headers mới áp dụng API/static backend; HTML frontend cần CSP riêng tại hosting phù hợp assets/fonts/Socket.IO. Không tuyên bố backend Helmet thay thế CSP frontend.
- **Rollback:** revert source/config/client/dependency changes về `942b330`, rebuild; không DB rollback. WebP mới vẫn là ảnh static và URL tuyệt đối lưu ở profile vẫn hợp lệ. Revert sẽ mở lại các lỗ hổng đã tái hiện, nên ưu tiên fix forward và giữ metrics disabled/proxy explicit.
- Không kết luận beta readiness hay “hệ thống đã an toàn hoàn toàn”.

## Next recommended ticket

**IC-008 — Correct public marketing claims:** đối chiếu số câu/thời lượng/mentor/bài viết và các tuyên bố khoa học/#1 ở Landing/Test/Results theo file 06. Thực hiện một ticket riêng; email IC-001 vẫn cần owner provider/config như backlog.

Tham chiếu kỹ thuật primary: [Express proxy trust](https://expressjs.com/en/guide/behind-proxies/), [Helmet headers](https://helmet.js.org/), [sharp input limits](https://sharp.pixelplumbing.com/api-constructor/), [sharp output/metadata](https://sharp.pixelplumbing.com/api-output/), [Redis INCR/atomic limiter](https://redis.io/docs/latest/commands/incr/).

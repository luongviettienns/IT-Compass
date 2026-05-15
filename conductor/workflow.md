# Workflow phát triển

## Nguyên tắc cốt lõi

1. **plan.md là nguồn sự thật** — mọi tiến độ track phải nằm trong plan.
2. **Strict TDD** — làm đến đâu kiểm tra đến đó; với thay đổi đáng kể, test phải đi trước implementation.
3. **CI/CD-compatible** — không merge khi lint, typecheck, build hoặc test chưa đạt.
4. **Commit nhỏ và rõ ràng** — mỗi commit nên phản ánh đúng một bước tiến có thể kiểm chứng.

## Vòng đời một task

### 1. Chọn task

- Đọc plan.md.
- Kiểm tra dependency đã xong chưa.
- Xác nhận acceptance criteria.

### 2. Đánh dấu đang làm

- Chuyển trạng thái task sang `[~]`.
- Ghi nhận bắt đầu nếu cần đo tốc độ.

### 3. RED

- Viết test fail trước cho hành vi cần thêm.
- Giữ test ngắn, rõ, tập trung vào hành vi.

### 4. GREEN

- Viết code tối thiểu để test pass.
- Ưu tiên đúng trước đẹp sau.

### 5. REFACTOR

- Tách code cho dễ đọc, dễ test, dễ bảo trì.
- Giữ nguyên hành vi đã có.

### 6. Xác minh

- Chạy test, lint, typecheck và build theo ngữ cảnh của thay đổi.
- Nếu là UI, mở browser và kiểm tra luồng thật.

### 7. Ghi chú lệch so với spec

- Nếu implementation lệch khỏi spec, ghi rõ lý do.
- Cập nhật spec nếu thay đổi là cố định.

### 8. Commit code

- Stage đúng file liên quan.
- Dùng Conventional Commits.
- Mỗi commit nên mô tả đúng mục tiêu thay đổi.

### 9. Cập nhật plan

- Đánh dấu task hoàn thành trong plan.md.
- Cập nhật task kế tiếp nếu có ảnh hưởng dây chuyền.

### 10. Checkpoint phase

- Khi kết thúc phase, chạy bộ kiểm tra cuối và tạo checkpoint commit riêng.

## Protocol khi hoàn thành phase

### Checkpoint bắt buộc

Mỗi phase phải kết thúc bằng:

1. Tất cả task trong phase đã hoàn tất.
2. Test/verification đã chạy xong.
3. Typecheck, lint và build không lỗi.
4. UI/realtime flow đã được kiểm tra bằng browser nếu có thay đổi ảnh hưởng trải nghiệm.

### Kiểm thử

```bash
cd backend && npm run typecheck && npm run lint && npm run build
cd frontend && npm run build && npm run lint
```

> Khi test runner được thêm vào repo, mọi thay đổi đáng kể phải chạy thêm test suite tương ứng trước khi merge.

### Cửa ải phê duyệt thủ công

Cần xác nhận trước khi đi tiếp với các thay đổi:

- Auth/session.
- Schema database hoặc migration.
- Phân quyền admin/mentor.
- Luồng realtime Socket.IO.
- Thay đổi security hoặc env.

## Quality gates

| Gate | Yêu cầu | Command |
| --- | --- | --- |
| Tests | Có test cho hành vi mới | `npm test` khi test runner đã tồn tại |
| Types | Không có lỗi type | `cd backend && npm run typecheck` / `cd frontend && npm run build` |
| Style | Theo style guide | `npm run lint` |
| Build | Build được cả hai app | `npm run build` ở backend và frontend |
| Mobile | UI responsive | Kiểm tra bằng browser |
| Security | Không lộ secret, không phá auth | Review thủ công |

## Lệnh phát triển

### Setup môi trường

```bash
cd backend && npm install
cd frontend && npm install
```

### Chạy dev

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

### Kiểm tra trước commit

```bash
cd backend && npm run typecheck && npm run lint && npm run build
cd frontend && npm run build && npm run lint
```

### Xác minh đầy đủ

```bash
cd backend && npm run typecheck && npm run lint && npm run build
cd frontend && npm run build && npm run lint
# + browser pass nếu thay đổi UI
```

## Ghi nhớ khi làm việc

- Giữ commit nhỏ.
- Không bỏ qua test chỉ để đi nhanh.
- Không thêm wrapper hoặc abstraction dư thừa nếu không phục vụ rõ ràng.
- Ưu tiên sửa gốc rễ thay vì lách qua lỗi.

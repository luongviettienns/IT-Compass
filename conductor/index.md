# Conductor Hub

## Dự án: ITCompass

Trung tâm điều hướng cho toàn bộ tài liệu Conductor và các track phát triển của dự án.

## Quick Links

### Core Documents

| Tài liệu | Mô tả | Trạng thái |
| --- | --- | --- |
| [Tầm nhìn sản phẩm](./product.md) | Tổng quan sản phẩm, vấn đề, người dùng và mục tiêu | Done |
| [Nguyên tắc sản phẩm](./product-guidelines.md) | Giọng điệu, thông điệp, nguyên tắc thiết kế | Done |
| [Tech Stack](./tech-stack.md) | Quyết định công nghệ, hạ tầng và công cụ | Done |
| [Workflow](./workflow.md) | Quy trình làm việc, kiểm thử và phê duyệt | Done |

### Track Management

| Tài liệu | Mô tả |
| --- | --- |
| [Track Registry](./tracks.md) | Danh sách mọi track phát triển | 

### Style Guides

| Guide | Phạm vi | Trạng thái |
| --- | --- | --- |
| [General](./code_styleguides/general.md) | Nguyên tắc chung | Done |
| [TypeScript](./code_styleguides/typescript.md) | Quy ước TypeScript | Done |
| [JavaScript](./code_styleguides/javascript.md) | Quy ước JavaScript | Done |

## Active Tracks

Chưa có track nào.

## Trạng thái dự án

**Giai đoạn hiện tại:** Setup hoàn tất
**Tiến độ tổng:** 100%

### Mốc hiện tại

| Mốc | Trạng thái |
| --- | --- |
| Setup Conductor | Hoàn tất |
| Sẵn sàng tạo track đầu tiên | Hoàn tất |

## Bắt đầu từ đâu

1. Đọc [Tầm nhìn sản phẩm](./product.md) để lấy bối cảnh.
2. Kiểm tra [Tech Stack](./tech-stack.md) để biết công nghệ và ràng buộc.
3. Đọc [Workflow](./workflow.md) để làm việc theo đúng nhịp.
4. Tạo track đầu tiên bằng `/conductor:new-track`.

## Lệnh tham chiếu

```bash
# Setup
cd backend && npm install
cd frontend && npm install

# Phát triển
cd backend && npm run dev
cd frontend && npm run dev

# Kiểm tra
cd backend && npm run typecheck && npm run lint
cd frontend && npm run build && npm run lint

# Build
cd backend && npm run build
cd frontend && npm run build
```

**Cập nhật lần cuối:** 2026-05-04
**Phụ trách:** Claude

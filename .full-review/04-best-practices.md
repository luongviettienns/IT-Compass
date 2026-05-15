# Phase 4: Best Practices & Standards

## Framework & Language Findings

**Summary:** 0 Critical, 0 High, 4 Medium, 1 Low

### Medium
- **`vite.config.ts` dùng `__dirname` trong file ESM** (`frontend/vite.config.ts:1-12`). Nên chuyển sang `import.meta.url` + `fileURLToPath()` để tránh lệ thuộc transpile behavior.
- **TypeScript path alias chưa có `baseUrl` rõ ràng** (`frontend/tsconfig.app.json:26-28`, `frontend/tsconfig.json:7-11`). Dễ lệch giữa TS và Vite resolve.
- **Router layout đang phân nhánh thủ công theo `pathname`** (`frontend/src/App.tsx:50-137`). Nên chuyển sang nested routes / route tree.
- **Auth bootstrap là state machine thủ công** (`frontend/src/contexts/AuthContext.tsx:64-97`). Nên chuẩn hoá bằng `useQuery` hoặc custom hook rõ ràng hơn.

### Low
- **`LandingPage` là monolith component** (`frontend/src/pages/LandingPage.tsx:49-220`). Nên tách section component nhỏ hơn để dễ test và maintain.

## CI/CD & DevOps Findings

**Summary:** 1 Critical, 4 High, 1 Medium

### Critical
- **CI/CD pipeline ở mức repository gần như chưa có**. Không thấy workflow tự động, không có test gate, không có security scanning. Điều này làm chất lượng release phụ thuộc gần như hoàn toàn vào thao tác thủ công.

### High
- **Chiến lược deploy chưa progressive / rollback-safe**. Không có blue-green/canary/rollback flow rõ ràng, trong khi scheduler chạy trong process sẽ làm rollout nhiều instance rủi ro hơn.
- **Infrastructure chưa được quản lý như code**. Không thấy IaC cho hạ tầng hoặc runtime topology.
- **Monitoring / observability chưa production-hardened**. Metrics protection còn phụ thuộc biến môi trường tùy chọn, chưa thấy dashboard/alerting/runbook đầy đủ.
- **Environment management dùng default không an toàn**. `.env.example` có các giá trị dễ làm suy yếu bảo vệ production nếu copy thẳng.

### Medium
- **Incident response chưa được operationalize**. Chưa có runbook, escalation notes, hay rollback playbook ngắn gọn.

## Phases 5 Context

Các ưu tiên ảnh hưởng trực tiếp tới bước tổng hợp cuối cùng:
- CI/CD thiếu hẳn là vấn đề lớn nhất ở mức vận hành.
- Cấu hình build/type path alias và router structure là những điểm nên chuẩn hóa trước khi mở rộng frontend.
- Unsafe env defaults và thiếu observability/runbook phải được phản ánh rõ trong action plan cuối.

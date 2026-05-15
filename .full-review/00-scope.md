# Review Scope

## Target

Audit tổng thể dự án ITCompass trong repo hiện tại. Mục tiêu: rà soát kiến trúc, security, performance, testing, và best practices; chỉ ra các điểm cần chuẩn hóa trước khi mình chuyển sang simplify và claude-md-improver. Hãy ưu tiên nêu những vấn đề có thể kiểm chứng trực tiếp trong code hiện tại, tránh suy đoán. Trả lời ngắn gọn nhưng đủ để quyết định bước tiếp theo.

## Files

### Backend source and config
- `backend/src/**/*.ts`
- `backend/prisma/schema.prisma`
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/eslint.config.js`
- `backend/.env.example`
- `backend/.gitignore`

### Frontend source and config
- `frontend/src/**/*.{ts,tsx}`
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/tsconfig.app.json`
- `frontend/tsconfig.node.json`
- `frontend/vite.config.ts`
- `frontend/tailwind.config.js`
- `frontend/postcss.config.js`
- `frontend/eslint.config.js`
- `frontend/.gitignore`

### Repository-level files
- `.gitignore`

### Build output consistency check
- `backend/dist/**/*.js`

## Flags

- Security Focus: yes
- Performance Critical: yes
- Strict Mode: yes
- Framework: React + Express + TypeScript (auto-detected)

## Review Phases

1. Code Quality & Architecture
2. Security & Performance
3. Testing & Documentation
4. Best Practices & Standards
5. Consolidated Report

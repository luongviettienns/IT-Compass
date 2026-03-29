# 🧭 IT Compass - Career Guidance Platform

Hệ thống hướng nghiệp công nghệ hiện đại, tập trung vào trải nghiệm người dùng premium và tính tương tác cao.

## 🎨 Hệ Thống Thiết Kế (Design System)

Tất cả các thành phần mới phải tuân thủ các quy tắc thiết kế sau để đảm bảo tính đồng bộ:

### 1. Bảng Màu (Color Palette)
- **Primary:** `#B2FFFF` (Xanh nhạt sáng) - Dùng cho các chi tiết nhỏ, highlight.
- **Secondary:** `#00B4D8` (Xanh thương hiệu chính) - Dùng cho nút bấm, icons, link quan trọng.
- **Selection:** `secondary/30` - Màu nền khi bôi đen văn bản.
- **Background:** Dark/Clean background với hiệu ứng gradient nhẹ.

### 2. Hiệu Ứng Signature (Glassmorphism)
Hầu hết các Card và Section sử dụng phong cách Glassmorphism:
- **Nền:** `bg-card/60` (hoặc `bg-card/70`) kèm `backdrop-blur-xl` (hoặc `backdrop-blur-sm`).
- **Viền:** `border-border/50` hoặc `border-white/10`.
- **Hover:** 
  - Đổi màu viền sang `border-secondary/40`.
  - Hiệu ứng đổ bóng phát sáng: `shadow-[0_0_30px_-10px_rgba(0,180,216,0.3)]`.
  - Nhấc card lên: `-translate-y-1.5` hoặc `-translate-y-2`.

### 3. Thành Phần Quan Trọng
- **Buttons:** 
  - Nút chính (Login): Có viền animated gradient (`animate-[gradient-x_3s_linear_infinite]`).
  - Nút phụ: Bo tròn hoàn toàn (`rounded-full`), có icon đi kèm.
- **Bottom Navigation (Mobile):** Thay thế hamburger menu để mang lại trải nghiệm giống Web App. Sử dụng icon từ `lucide-react`.
- **Testimonial Cards:** 
  - Sắp xếp so le (staggered).
  - Có watermark icon `Quote` khổng lồ ở góc.
  - Vòng tròn Avatar có gradient border.

### 4. Typography
- **Headings:** `font-extrabold`, `tracking-tight`. Thường sử dụng `bg-clip-text text-transparent bg-gradient-to-...` cho tiêu đề chính.
- **Body:** `text-muted-foreground` cho văn bản mô tả để tạo độ sâu cho giao diện.

## 🛠 Công Nghệ Sử Dụng

- **Frontend:** React + TypeScript + Vite.
- **Styling:** Tailwind CSS + Shadcn UI.
- **Icons:** Lucide React.
- **Routing:** React Router DOM.
- **Animations:** CSS Keyframes + Transitions (Framer Motion behavior).

## 📂 Cấu Trúc Thư Mục

- `src/components/sections/`: Các thành phần lớn, layout của trang.
- `src/components/ui/` (Shadcn): Các nguyên tử UI (Button, Input, Card).
- `src/pages/`: Các trang chính (Landing, Blog, Jobs, Test).
- `src/data/`: Dữ liệu mock (ví dụ: `jobs.ts`).

## 🚀 Cách Chạy Dự Án

1. Di chuyển vào thư mục frontend: `cd frontend`
2. Cài đặt dependency: `npm install`
3. Chạy môi trường phát triển: `npm run dev`

---
*Ghi chú: Luôn ưu tiên trải nghiệm mobile-first với thanh BottomNav.*

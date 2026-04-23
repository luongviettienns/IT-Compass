/**
 * @file slug.ts - Tiện ích tạo slug URL-friendly từ chuỗi Unicode.
 *
 * Dùng để tạo slug cho bài viết blog, mentor profile, v.v.
 * Xử lý: lowercase → loại bỏ dấu tiếng Việt (NFD + strip combining marks) → thay ký tự đặc biệt bằng '-'.
 */
/**
 * Chuyển đổi chuỗi bất kỳ thành slug URL-friendly.
 * Ví dụ: 'Lập Trình Viên Full Stack' → 'lap-trinh-vien-full-stack'
 *
 * @param value - Chuỗi cần chuyển đổi.
 * @returns Slug chỉ chứa a-z, 0-9 và dấu gạch nối.
 */
export const slugify = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

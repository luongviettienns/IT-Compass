/**
 * @file upload.ts - Cấu hình Multer cho upload hình ảnh.
 *
 * File này chịu trách nhiệm:
 * - Tạo thư mục uploads nếu chưa tồn tại.
 * - Giữ file trong bộ nhớ có giới hạn; chưa lưu dữ liệu chưa xác minh ra public.
 * - Giới hạn kích thước file và số lượng file upload.
 * - Validate MIME type và phần mở rộng file, chỉ cho phép ảnh JPG/PNG/WEBP/GIF.
 */

import fs from 'node:fs';
import path from 'node:path';

import multer from 'multer';
import type { FileFilterCallback } from 'multer';

import { env } from './env.js';
import { HttpError } from '../utils/httpError.js';

/** Đường dẫn tuyệt đối tới thư mục lưu trữ file upload. */
export const uploadDirectory = path.resolve(process.cwd(), 'uploads');

// Tự động tạo thư mục uploads nếu chưa có.
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

/** Danh sách MIME type ảnh được phép upload. */
const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

/** Danh sách phần mở rộng file ảnh được phép. */
const allowedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

/**
 * Middleware Multer đã cấu hình cho upload ảnh.
 * - Giới hạn kích thước file theo env.uploadMaxFileSizeMb.
 * - Chỉ cho phép 1 file mỗi request.
 * - Validate MIME type và extension trước khi lưu.
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploadMaxFileSizeMb * 1024 * 1024,
    files: 1,
    fields: 0,
    // Busboy emits partsLimit when it reaches the count, including a valid part.
    parts: 2,
  },
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const isAllowedMimeType = allowedImageMimeTypes.has(file.mimetype);
    const isAllowedExtension = allowedImageExtensions.has(extension);

    if (!isAllowedMimeType || !isAllowedExtension) {
      cb(new HttpError(400, 'Only JPG, PNG, WEBP, or GIF images are allowed', undefined, 'UPLOAD_INVALID_IMAGE_TYPE'));
      return;
    }

    cb(null, true);
  },
});

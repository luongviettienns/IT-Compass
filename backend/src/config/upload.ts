/**
 * @file upload.ts - Cấu hình Multer cho upload hình ảnh.
 *
 * File này chịu trách nhiệm:
 * - Tạo thư mục uploads nếu chưa tồn tại.
 * - Cấu hình Multer storage: đổi tên file thành dạng `img_{timestamp}_{random}.{ext}`.
 * - Giới hạn kích thước file và số lượng file upload.
 * - Validate MIME type và phần mở rộng file, chỉ cho phép ảnh JPG/PNG/WEBP/GIF.
 */

import crypto from 'node:crypto';
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
 * Cấu hình disk storage cho Multer:
 * - destination: lưu vào thư mục uploads.
 * - filename: tạo tên file an toàn với timestamp + random hex để tránh trùng lặp.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirectory),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = allowedImageExtensions.has(ext) ? ext : '.jpg';
    cb(null, `img_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${safeExt}`);
  },
});

/**
 * Middleware Multer đã cấu hình cho upload ảnh.
 * - Giới hạn kích thước file theo env.uploadMaxFileSizeMb.
 * - Chỉ cho phép 1 file mỗi request.
 * - Validate MIME type và extension trước khi lưu.
 */
export const imageUpload = multer({
  storage,
  limits: {
    fileSize: env.uploadMaxFileSizeMb * 1024 * 1024,
    files: 1,
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

import { Router } from 'express';

import { imageUpload } from '../config/upload.js';
import { requireActiveUser, requireAuth } from '../middlewares/auth.middleware.js';
import { uploadImageLimiter } from '../middlewares/rate-limit.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

const uploadRoutes = Router();

uploadRoutes.post(
  '/images',
  requireAuth,
  requireActiveUser,
  uploadImageLimiter,
  imageUpload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, 'Image file is required', undefined, 'UPLOAD_IMAGE_REQUIRED');
    }

    const relativePath = `/uploads/${req.file.filename}`;
    const host = req.get('host');
    const fullUrl = host ? `${req.protocol}://${host}${relativePath}` : relativePath;

    return res.status(201).json({
      url: fullUrl,
      filename: req.file.filename,
    });
  }),
);

export default uploadRoutes;

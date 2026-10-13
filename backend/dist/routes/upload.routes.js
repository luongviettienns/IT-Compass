import { Router } from 'express';
import { imageUpload } from '../config/upload.js';
import { requireActiveUser, requireAuth } from '../middlewares/auth.middleware.js';
import { uploadImageLimiter } from '../middlewares/rate-limit.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { persistVerifiedImage } from '../services/verified-image.service.js';
import { createUploadAdmission } from '../middlewares/upload-admission.middleware.js';
const uploadRoutes = Router();
uploadRoutes.post('/images', requireAuth, requireActiveUser, uploadImageLimiter, createUploadAdmission(), imageUpload.single('image'), asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new HttpError(400, 'Image file is required', undefined, 'UPLOAD_IMAGE_REQUIRED');
    }
    const filename = await persistVerifiedImage(req.file);
    return res.status(201).json({
        url: `/uploads/${filename}`,
        filename,
    });
}));
export default uploadRoutes;

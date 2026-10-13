import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { uploadDirectory } from '../config/upload.js';
import { HttpError } from '../utils/httpError.js';
const MAX_PIXELS = 16_000_000;
const MAX_FRAMES = 100;
const MAX_SIDE = 8192;
let processing = 0;
const formats = {
    jpeg: { mime: 'image/jpeg', extensions: ['.jpg', '.jpeg'] },
    png: { mime: 'image/png', extensions: ['.png'] },
    webp: { mime: 'image/webp', extensions: ['.webp'] },
    gif: { mime: 'image/gif', extensions: ['.gif'] },
};
const detectFormat = (buffer) => {
    if (buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')))
        return 'png';
    if (buffer.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex')))
        return 'jpeg';
    if (['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6)))
        return 'gif';
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP')
        return 'webp';
    return null;
};
/** Decode the whole image and discard metadata/trailing payload before publishing. */
export const persistVerifiedImage = async (file) => {
    const byteLimit = env.uploadMaxFileSizeMb * 1024 * 1024;
    const detected = detectFormat(file.buffer);
    const extension = path.extname(file.originalname).toLowerCase();
    if (!detected || formats[detected].mime !== file.mimetype || !formats[detected].extensions.includes(extension)) {
        throw new HttpError(400, 'Image content does not match its file type', undefined, 'UPLOAD_INVALID_IMAGE_CONTENT');
    }
    if (file.buffer.length > byteLimit)
        throw new HttpError(400, 'Image is too large', undefined, 'UPLOAD_FILE_TOO_LARGE');
    if (processing >= 4)
        throw new HttpError(503, 'Image processing is busy. Please try again.', undefined, 'UPLOAD_BUSY');
    processing += 1;
    let output;
    try {
        const image = sharp(file.buffer, { animated: true, failOn: 'warning', limitInputPixels: MAX_PIXELS });
        const metadata = await image.metadata();
        const width = metadata.width || 0;
        const height = metadata.pageHeight || metadata.height || 0;
        const frames = metadata.pages || 1;
        if (metadata.format !== detected || !width || !height || width > MAX_SIDE || height > MAX_SIDE || frames > MAX_FRAMES || width * height * frames > MAX_PIXELS) {
            throw new HttpError(400, 'Image dimensions or animation exceed the limit', undefined, 'UPLOAD_INVALID_IMAGE_CONTENT');
        }
        // Orientation belongs to a single frame; metadata is stripped by default.
        if (frames === 1)
            image.autoOrient();
        output = await image.webp({ quality: 85, effort: 3 }).timeout({ seconds: 5 }).toBuffer();
        if (output.length > byteLimit)
            throw new HttpError(400, 'Processed image is too large', undefined, 'UPLOAD_FILE_TOO_LARGE');
    }
    catch (error) {
        if (error instanceof HttpError)
            throw error;
        throw new HttpError(400, 'Image content is invalid or cannot be safely processed', undefined, 'UPLOAD_INVALID_IMAGE_CONTENT');
    }
    finally {
        processing -= 1;
    }
    const filename = `img_${crypto.randomUUID()}.webp`;
    await fs.writeFile(path.join(uploadDirectory, filename), output, { flag: 'wx' });
    return filename;
};

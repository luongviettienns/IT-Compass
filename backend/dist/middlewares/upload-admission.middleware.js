import { HttpError } from '../utils/httpError.js';
/** Bound multipart buffering before Multer allocates memory, including stalled bodies. */
export const createUploadAdmission = (limit = 4) => {
    let active = 0;
    return (req, res, next) => {
        if (active >= limit) {
            res.setHeader('Retry-After', '5');
            return next(new HttpError(503, 'Image uploads are busy. Please try again.', undefined, 'UPLOAD_BUSY'));
        }
        active += 1;
        const timer = setTimeout(() => req.destroy(), 30_000);
        let released = false;
        const release = () => {
            if (released)
                return;
            released = true;
            clearTimeout(timer);
            active -= 1;
        };
        res.once('finish', release);
        res.once('close', release);
        next();
    };
};

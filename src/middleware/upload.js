import multer from "multer";
import { logger } from "../config/logger.js"

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "application/pdf",
]);

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1, 
        fields: 0,
        parts: 1
    },

    fileFilter: (_req, file, cb) => {
        logger.info("enter middleware")
        if (!allowedMimeTypes.has(file.mimetype)) {
            const error = new Error("Only JPEG, PNG and PDF files are allowed.");
            error.statusCode = 400;
            return cb(error);
        }

        cb(null, true)
    }
});

export function uploadSingleAttachment(req, res, next) {
    logger.info("[UPLOAD MW] Started");

    upload.single("file")(req, res, (error) => {
        if (error) {
            console.error(error);
            return next(error);
        }
    logger.info("[UPLOAD MW] Completed");
    next();

    })
}
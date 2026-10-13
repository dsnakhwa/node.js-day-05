import { fileTypeFromBuffer } from "file-type";
import {AppError} from './AppError.js'
import { logger } from "../config/logger.js"

const allowedTypes = new Map([
    ["image/jpeg", ".jpg"],
    ["image/png", ".png"],
    ["application/pdf", ".pdf"],
]);

export async function validateUploadedFile(file) {
    if (!file?.buffer ||file?.size === 0) {
       throw new AppError("A non-empty file is required.", 400);
    }

    const detected = await fileTypeFromBuffer(file.buffer);

    logger.info(detected.mime);

    if (!detected || !allowedTypes.has(detected.mime)) {
        throw new AppError("Invalid or unsupported file format.", 400);
    }

    if (detected.mime !== file.mimetype) {
   throw new AppError("File content and MIME type do not match.", 400);
    }

    return {
        mimeType: detected.mime,
        extension: allowedTypes.get(detected.mime),
    }
}
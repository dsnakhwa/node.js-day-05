import crypto from "node:crypto";
import path from "node:path";
import {
    mkdir,
    writeFile,
    unlink
} from "node:fs/promises";


const UPLOAD_DIR = path.resolve("uploads");

export async function saveUploadedFile(buffer, extension) {
    const filename =`${crypto.randomUUID()}${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    
    await mkdir(UPLOAD_DIR, {recursive: true});

    await writeFile(filePath, buffer, {
        flag: "wx",
        mode: 0o600,
    });

    return { filename, filePath };
}

export async function deleteUploadedFile(filename) {

    if (!/^[0-9a-f-]{36}\.(png|jpg|pdf)$/i.test(filename)){
        throw new Error("Invalid stored filename");

    }

    const filePath = path.join(UPLOAD_DIR, filename);
    await unlink(filePath);
}

export function getUploadedFilePath(filename) {
        if (!/^[0-9a-f-]{36}\.(png|jpg|pdf)$/i.test(filename)){
        throw new Error("Invalid stored filename");

    }

    return path.join(UPLOAD_DIR, filename);
}
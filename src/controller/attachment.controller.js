import path from "node:path";
import { unlink } from "node:fs/promises";
import { prisma } from "../config/prisma.js";
import { validateUploadedFile } from "../utils/file-validation.js";
import { saveUploadedFile, deleteUploadedFile, getUploadedFilePath } from "../utils/upload.util.js";
import { logger } from "../config/logger.js"


const uploadDir = path.resolve("private-uploads");

export async function uploadAttachment(req, res, next) {
    let savedFile;

    try {
        if (!req.file){
            return res.status(400).json({
                message: "A file is required",
            });
        }

        logger.info("[UPLOAD] Controller reached");
        logger.info("[UPLOAD] File reached", Boolean(req.file));

        logger.info("")
        const taskId = Number(req.params.taskId || 0);
        const userId = req.user.id;

        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                userId
            },
            select: {
                id:true
            }
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found.",
            })
        }

        const { mimeType, extension } = await validateUploadedFile(req.file);

        savedFile = await saveUploadedFile(
            req.file.buffer, 
            extension
        )

        const attachment = await prisma.attachment.create({
            data: {
                taskId: task.id,
                filename: savedFile.filename,
                originalName: path.basename(req.file.originalname),
                mimeType,
                size: req.file.size,
            },
            select: {
                id: true,
                taskId: true,
                originalName: true,
                mimeType: true,
                size: true,
                createdAt: true
            }
        });
        
        return res.status(201).json({
            message:"Attachment uploaded successfully.",
            attachment,
        });
    } catch (error) {
        if (savedFile) {
            await deleteUploadedFile(savedFile.filename).catch(() => {});
        }

        next(error)
    }
}

export async function downloadAttachment(req, res, next) {
    try {
        const attachment = await prisma.attachment.findFirst({
            where: {
                id: req.params.attachmentId,
                task: {
                    userId: req.user.id
                }
            },
        });

        if (!attachment) {
            return res.status(404).json({
                message: "Attachment not found.",
            });
        }

        const filePath = getUploadedFilePath(attachment.filename);

        res.setHeader("X-Content-Type-Options", "nosniff");

        return res.download(
            filePath,
            attachment.originalName,
            (error) => {
                if (error && !res.headersSent) {
                    next(error);
                }
            }
        );
    } catch (error) {
        next(error);
    }
}

export async function removeAttachment(req, res, next) {
    try {
         const attachment = await prisma.attachment.findFirst({
            where: {
                id: req.params.attachmentId,
                task: {
                    userId: req.user.id
                }
            },
        });

        if (!attachment) {
            return res.status(404).json({
                message: "Attachment not found.",
            });
        }

        await prisma.attachment.delete({
            where: {id: attachment.id},
        });

        try {
            await deleteUploadedFile(attachment.filename);
        } catch (error) {
            console.error("Attachment file cleanup failed", {
                attachment: attachment.id,
                error
            });

            return res.status(500).json({
                message: "Attachment metadata was deleted, but file cleanup failed.",
            });
        }

        return res.status(200).json({
            message: "Attachment deleted successfully.",
        })
    } catch (error) {
        next(error)
    }
}
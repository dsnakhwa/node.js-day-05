import { Router } from "express";

import {
    uploadAttachment,
    downloadAttachment,
    removeAttachment
} from "../controller/attachment.controller.js";

import { uploadSingleAttachment } from "../middleware/upload.js";
import  { authenicate } from "../middleware/auth.js";

const attachmentRouter = Router();

attachmentRouter.post(
    "/tasks/:taskId",
    authenicate,
    uploadSingleAttachment,
    uploadAttachment
);

attachmentRouter.get(
    "/:attachmentId/download",
    authenicate,
    downloadAttachment
);

attachmentRouter.delete(
    "/:attachmentId",
    authenicate,
    removeAttachment
)

export default attachmentRouter;
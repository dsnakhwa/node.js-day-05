import nodemailer from "nodemailer";
import { logger } from "../config/logger.js"


let transporterPromise;

async function getTransporter() {
    try {
        if (!transporterPromise) {
            transporterPromise = (async () => {
                const account = await nodemailer.createTestAccount();
                logger.info(account);

                logger.info("[EMAIL] Ethereal test account:", account.user);
                const transporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    secure: false,
                    requireTLS: true,
                    connectionTimeout: 20000,
                    greetingTimeout: 20000,
                    socketTimeout:30000,
                    auth: {
                        user: account.user,
                        pass: account.pass
                    }
                });

                await transporter.verify();

                return { transporter, sender: account.user};
            })().catch((error) => {
                logger.info(error);
                transporterPromise = undefined;
                throw error;
            });

            return transporterPromise;
        }
    } catch (error) {
        console.error(error);
    }
}

export async function sendTaskCreateEmail(task) {
    const recipient = process.env.MAIL_TO;

    if (!recipient) {
        throw new Error("MAIL_TO is not configured");
    }

    const {transporter, sender} = await getTransporter();

    const info = await transporter.sendMail({
        from: `"Task Manager" <${sender}>`,
        to :recipient,
        subject: `Task created: ${task.title}`,
        text: [
            "A new task has been created.",
            "",
            `Title: ${task.title}`,
            `Description: ${task.description} ?? No description`,
            `Status: ${task.status}`,
            `Priority: ${task.priority}`,
            `Task ID: ${task.id}`,
        ].join("\n"),
        html:`
        <h2> New Task Created</h2>
        <p> A task has been successfullu created in Task Maanager. </p>
        <ul>
         <li><strong>Title: </strong> ${escapeHtml(task.title)}</li>
         <li><strong>Description: </strong> ${escapeHtml(task.description ?? "No Description")}</li>
         <li><strong>Status: </strong> ${escapeHtml(task.status)}</li>
         <li><strong>Priority: </strong> ${escapeHtml(task.priority)}</li>
         <li><strong>Task ID: </strong> ${escapeHtml(task.id)}</li>
        </ul>
        `
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);

    logger.info("[EMAIL] Task notification captured.", {
        messageId: info.messageId,
        recipient,
        previewUrl,
    });

    return { messageId: info.messageId, previewUrl };
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<" : "&lt;",
            ">": "&gt;",
            "": "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}
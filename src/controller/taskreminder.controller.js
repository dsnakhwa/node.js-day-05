import cron from "node-cron";
import { prisma } from "../config/prisma.js";
import { sendTaskCreateEmail } from "../utils/email.js";
import { logger } from "../config/logger.js"


let isRunning = false;

export function startTaskReminderJob() {

    cron.schedule(
        "0 9 * * *",
        async() => {
            if(isRunning) {
                console.warn("[REMINDER JOB] Previous run still run still active; skipping.");
                return;
            }

            isRunning = true;

            try {
                const tasks = await prisma.task.findMany({
                    where: { status: "TODO" },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        priority: true,
                        userId: true
                    },
                    orderBy: { createdAt: "asc" }
                });

                if (tasks.length === 0) {
                    logger.info("[REMINDER JOB] No pending tasks.");
                    return;
                }

                const summary = tasks.map((task) => `#${task.id} -- ${task.title} | Priority: ${task.priority}`).join("\n");
                await sendTaskCreateEmail({
                    id: "daily-summary",
                    title: `Daily pending-task summary (${tasks.length})`,
                    description: summary,
                    status: "TODO",
                    priority: "LOW",
                });

                logger.info(`[REMINDER JOB] Summary sent fro ${tasks.length} pending tasks.`);
            } catch (error) {
                console.error(error);
            } finally {
                isRunning = false;
            }
        },
        {
            timezone: process.env.TZ || "Asia/Kolkata",
        }
    );

    logger.info("[REMINDER JOB] Scheduled for 9:00 AM daily.")
}
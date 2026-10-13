import { logger } from "../config/logger.js";

let isShuttingDown = false;

export function gracefulShutdown(signal, io) {
    if (isShuttingDown) {
        logger.warn({signal}, "Shutdown already in progress");
        return;
    }

    isShuttingDown = true;

    logger.info({ signal }, "Graceful shutdown started");

    const forceExitTimer = setTimeout(() => {
        logger.error("Graceful Shutdown time out");
        process.exit(1);
    }, 15000);

    forceExitTimer.unref();

    io.close(async () => {
        try {
            await prisma.$disconnect();

            logger.info("Prisma disconnected successfully");
            logger.info("graceful shutdown completed");

            clearTimeout(forceExitTimer);
            process.exit(0);
        } catch (error) {
            logger.error({err: error}, "Shutdown failed");
            process.exit(1);
        }
    })
};
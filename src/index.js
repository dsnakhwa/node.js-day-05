import express from "express";
import 'dotenv/config';
import { taskRoutes } from "./routes/taskRoute.js";
import { logRequest } from "./middleware/requestLogger.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import cors from 'cors';
import morgan from 'morgan';
import helmet from "helmet";
import { authRoutes } from "./routes/authRoute.js";
import attachmentRouter from "./routes/attachment.routes.js";
import { createServer } from "node:http";
import { iniializeSocket } from "./config/socket.js";
import { startTaskReminderJob } from "./controller/taskreminder.controller.js";
import { workerRoutes } from "./routes/worker.routes.js";
import { requestLogger } from "./middleware/logger.middleware.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";
import { gracefulShutdown } from "./utils/gracefull.util.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(morgan("dev"));

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(requestLogger)
app.use(logRequest);
app.use(
  rateLimiter({
    maxRequests: 10,
    windowMs: 60000,
  }),
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/auth", authRoutes);
app.use("/api/attachment", attachmentRouter);
app.use("/tasks", taskRoutes);
app.use("/api/workers", workerRoutes)

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(notFound);
app.use(errorHandler);

// app.listen(PORT, () => {
//   logger.info(`Example app listening on port ${PORT}`);
// });

const httpServer = createServer(app);

const io = iniializeSocket(httpServer);
app.set("io", io);

startTaskReminderJob();
process.on("SIGINT", () => gracefulShutdown("SIGINT", io));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM", io));
httpServer.listen(PORT, () => {
  logger.info(`Express and Socket.IO listening on port ${PORT}`);
})

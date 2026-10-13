import pino from "pino";
export const logger = pino({
 level: process.env.LOG_LEVEL || "info",

 redact: {
    paths: [
        "req.headers.authorization",
        "req.header.cookie",
        "*.password",
        "*.token",
        "*.accessToken",
        "*.refreshToken",
    ],
    censor: "[REDACTED]",
 },

 ...(process.env.NODE_ENV !== "production" && {
    transport: {
        target: "pino-pretty",
        options:{
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname"
        }
    }
 })
})
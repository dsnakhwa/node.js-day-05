import { pinoHttp } from "pino-http";
import { logger } from "../config/logger.js";


export const requestLogger = pinoHttp({
    logger, 
    customLogLevel(_req, res, error) {
        if (error || res.statusCode >= 500)  return "error";
        if(res.statusCode >= 400) return "warn";
        return "info";
    },

    customSuccessMessage(req, res) {
        return `${req.method} ${req.url} completed with ${res.statusCode}`;
    }
})
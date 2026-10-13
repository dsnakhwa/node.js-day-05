import { logger } from "../config/logger.js"
export function logRequest(req, res, next) {
  res.on("finish", () => {
    logger.info(
      `[Request ID]: ${crypto.randomUUID()}, [Method]: ${req.method}, [Url]: '${req.originalUrl}', [Status]: ${res.statusCode ?? ''}`,
    );
  });

  next();
}

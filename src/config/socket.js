import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma.js";
import { logger } from "../config/logger.js"



export function iniializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_ORIGIN || "http://localhost:5500",
            methods: ["GET", "POST"]
        }
    });


    io.use(async (socket, next) => {
        try {
            logger.info(socket.handshake);
            const token = socket.handshake.headers?.access_token;

            if (!token || typeof token !== "string") {
                return next(new Error("Authentication required"));
            }
             
               const payload =jwt.verify(
                       token,
                       process.env.JWT_ACCESS_SECRET
                   );
           
               if(typeof payload === "string" || typeof payload.sub !== "string" || !Number.isSafeInteger(Number(payload.sub)) || Number(payload.sub) <=0 || typeof payload.jti !== "string" || typeof payload.exp !== "number") {
                   return next(new Error("Invalid access token"));
               }

               const revoked = await prisma.revokedToken.findUnique({
                where: {
                    jti: payload.jti
                }
               });

               if (revoked) {
                return next(new Error("Access token has been revoked"));
               }

               socket.data.userId = Number(payload.sub);

               next();
            
        } catch (error) {
            next(new Error("Invalid or expired access token"));
        }
    });

    io.on("connection", (socket) => {
        const room = `user:${socket.data.userId}`;

        socket.join(room);

        logger.info(`[Socket.IO] Connected: ${socket.id}`);
    });

    return io;
}
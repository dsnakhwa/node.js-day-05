import jwt from "jsonwebtoken";
import {prisma} from "../config/prisma.js";
import { logger } from "../config/logger.js"


export async function authenicate(req, res, next) {
    const authorization = req.headers.authorization;
    logger.info("ener auth");

    if (!authorization?.startsWith("Bearer")) {
        return res.status(401).json({
            message: "Authentication required.",
        })
    }

    let payload;

    try {
        payload =jwt.verify(
            authorization.slice(7),
            process.env.JWT_ACCESS_SECRET
        )
    } catch(err) {
        return res.status(401).json({
            message: "Invalid or expired access token.",
        })
    }

    if(typeof payload === "string" || typeof payload.sub !== "string" || !Number.isSafeInteger(Number(payload.sub)) || Number(payload.sub) <=0 || typeof payload.jti !== "string" || typeof payload.exp !== "number") {
        return res.status(401).json({
            message: "invalid access token.",
        })
    }

    try {
        const revoked = await prisma.revokedToken.findUnique({
            where: {jti: payload.jti},
        });

        if(revoked) {
            return res.status(401).json({
                message: "This token has been revoked.",
            })
        }

        const user = await prisma.user.findUnique({
            where: {id: Number(payload.sub)},
            select: {
                id: true,
                role: true,
            }
        });

        if(!user) {
            return res.status(401).json({
                message: "User no longer exists.",
            })
        }

        req.user= {
            id: user.id,
            role: user.role
        };

        logger.info(payload.exp);
        req.token = {
            jti: payload.jti,
            expiresAt: new Date(payload.exp * 1000),
        }

        logger.info("exiting")
        next();
    } catch(error) {
        logger.info(error);
        next(error)
    }
}

export function requireAdmin(req, res, next) {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({
            message: "Administrator access required.",
        })
    }

    next();
}
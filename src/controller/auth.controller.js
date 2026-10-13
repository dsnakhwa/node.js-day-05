import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js"


function createAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
      jwtid: randomUUID(),
    },
  );
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const normalizaedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizaedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizaedEmail,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    const accessToken = createAccessToken(user);

    return res.status(201).json({
      message: " Registration Successful.",
      data: { user, accessToken },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "An account with this email already exist",
      });
    }
    next(error);
  }
}

  export async function login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: {
          email: email.trim().toLowerCase(),
        },
      });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({
          message: "Invalid Email or password.",
        });
      }

      const accessToken = createAccessToken(user);

      return res.status(200).json({
        message: "login succesfull",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  export async function logout(req, res, next) {
    try {
      logger.info(req.token);
        await prisma.revokedToken.create({
            data: {
                jti: req.token.jti,
                expiresAt: req.token.expiresAt
            }
        });

        return res.status(200).json({
            message: "logged out succesfully"
        })
        
    } catch (error) {
        next(error)
    }
  }


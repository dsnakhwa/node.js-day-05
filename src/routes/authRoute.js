import { Router } from "express";
import { login, logout, register } from "../controller/auth.controller.js";
import { authenicate } from "../middleware/auth.js";



const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", authenicate ,logout);

export { authRoutes }
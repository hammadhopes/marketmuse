import Router from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);

authRouter.post("/login", validate(loginSchema), authController.login);

authRouter.get("/logout", authController.logout);

authRouter.get("/logout-all", authController.logoutAll);

authRouter.get("/get-me", authController.getMe);

authRouter.get("/refresh-token", authController.refreshToken);

export default authRouter;
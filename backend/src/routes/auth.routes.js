import Router from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);

authRouter.post("/login", validate(loginSchema), authController.login);

authRouter.post("/logout", requireAuth, authController.logout);

authRouter.post("/logout-all", requireAuth, authController.logoutAll);

authRouter.get("/get-me", requireAuth, authController.getMe);

authRouter.post("/refresh-token", authController.refresh);

export default authRouter;
import Router from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema, verifyEmailSchema, resendVerificationSchema, changeUsernameSchema } from "../validators/auth.validator.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    loginLimiter, registerLimiter, verifyLimiter, resendLimiter,
    refreshLimiter, usernameLimiter, oauthLimiter
} from "../middlewares/rateLimit.middleware.js";

const authRouter = Router();

authRouter.post("/register", registerLimiter, validate(registerSchema), authController.register);

authRouter.post("/login", loginLimiter, validate(loginSchema), authController.login);

authRouter.post("/logout", requireAuth, authController.logout);

authRouter.post("/logout-all", requireAuth, authController.logoutAll);

authRouter.get("/get-me", requireAuth, authController.getMe);

authRouter.post("/refresh-token", refreshLimiter, authController.refresh);

authRouter.post("/verify-email", verifyLimiter, validate(verifyEmailSchema), authController.verifyEmail);

authRouter.post("/resend-verification", resendLimiter, validate(resendVerificationSchema), authController.resendVerificationCode);

authRouter.post("/set-username", usernameLimiter, requireAuth, validate(changeUsernameSchema), authController.setUsername);

authRouter.get("/google", oauthLimiter, authController.googleRedirect);

authRouter.get("/google/callback", oauthLimiter, authController.googleCallback);

authRouter.get("/github", oauthLimiter, authController.githubRedirect);

authRouter.get("/github/callback", oauthLimiter, authController.githubCallback);

export default authRouter;
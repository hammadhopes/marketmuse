import { rateLimit } from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

const MINUTE = 60 * 1000;

function createLimiter({ windowMs, limit, skipSuccessfulRequests = false }) {
    return rateLimit({
        windowMs,
        limit,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        skipSuccessfulRequests,
        handler: (req, res, next) => next(new ApiError(429, "Too many requests, please try again later", "RATE_LIMITED"))
    });
}


export const apiLimiter = createLimiter({ windowMs: 15 * MINUTE, limit: 300 });

export const loginLimiter = createLimiter({ windowMs: 15 * MINUTE, limit: 10, skipSuccessfulRequests: true });

export const registerLimiter = createLimiter({ windowMs: 60 * MINUTE, limit: 10 });
export const resendLimiter = createLimiter({ windowMs: 60 * MINUTE, limit: 5 });

export const verifyLimiter = createLimiter({ windowMs: 15 * MINUTE, limit: 10 });
export const refreshLimiter = createLimiter({ windowMs: 15 * MINUTE, limit: 60 });
export const usernameLimiter = createLimiter({ windowMs: 15 * MINUTE, limit: 20 });
export const oauthLimiter = createLimiter({ windowMs: 15 * MINUTE, limit: 30 });
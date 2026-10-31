import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";


export const REFRESH_COOKIE_NAME = "refreshToken";
export const ACCESS_TTL = "15m";
export const REFRESH_TTL = "7d";
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; 

export const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

export const signAccessToken = (userId, sessionId) => {
    return jwt.sign(
        { id: userId, sessionId },
        config.JWT_ACCESS_SECRET,
        { expiresIn: ACCESS_TTL }
    );
};

export const signRefreshToken = (userId, sessionId) => {
    return jwt.sign(
        { id: userId, sessionId },
        config.JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TTL, jwtid: crypto.randomUUID() }
    );
};

const refreshCookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "strict",
    path: "/api/auth/refresh-token",
    maxAge: REFRESH_TTL_MS
};

export const setRefreshCookie = (res, token) => {
    res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions);
};

export const clearRefreshCookie = (res) => {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
}

import mongoose from "mongoose";
import Session from "../models/session.model.js";
import {
    hashToken, signAccessToken, signRefreshToken, setRefreshCookie, REFRESH_TTL_MS
} from "./token.js";


export async function createSession(user, req, res) {
    const sessionId = new mongoose.Types.ObjectId();
    const refreshToken = signRefreshToken(user._id, sessionId);

    await Session.create({
        _id: sessionId,
        user: user._id,
        refreshTokenHash: hashToken(refreshToken),
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS)
    });

    setRefreshCookie(res, refreshToken);
    return signAccessToken(user._id, sessionId);
}
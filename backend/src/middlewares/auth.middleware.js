import jwt from "jsonwebtoken";
import config from "../config/config.js";
import Session from "../models/session.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function requireAuth(req, res, next) {
    const header = req.headers.authorization;

    if(!header?.startsWith("Bearer ")) throw new ApiError(401, "Access token missing");

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);

    const sessionActive = await Session.exists({ _id: decoded.sessionId, revoked: false });
    if(!sessionActive) throw new ApiError(401, "Session expired or revoked");

    req.auth = { userId: decoded.id, sessionId: decoded.sessionId };

    next();
}
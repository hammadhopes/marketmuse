import crypto from "crypto";
import config from "../config/config.js";

export const OTP_TTL_MS = 10 * 60 * 1000;          //  10 minutes
export const OTP_MAX_ATTEMPTS = 5;                 
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export const generateOtp = () => {
    return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export const hashOtp = (userId, code) => {
    return crypto.createHmac("sha256", config.OTP_SECRET)
        .update(`${userId}:${code}`)
        .digest("hex");
}

export const isSameHash = (a, b) => {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import Otp from "../models/otp.model.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { createSession } from "../utils/session.js";
import config from "../config/config.js";
import { issueVerificationOtp } from "../utils/verification.js";
import { hashOtp, isSameHash, OTP_MAX_ATTEMPTS, OTP_RESEND_COOLDOWN_MS } from "../utils/otp.js";
import { saveWithUsername, USERNAME_CHANGE_LIMIT, USERNAME_CHANGE_WINDOW_MS } from "../utils/username.js";
import { 
    clearRefreshCookie, REFRESH_COOKIE_NAME, REFRESH_TTL_MS, signAccessToken, signRefreshToken, setRefreshCookie, hashToken 
} from "../utils/token.js";



export async function register(req, res) {
    const { email, password } = req.body;

    let user = await User.findOne({ email });

    if(user?.isEmailVerified) throw new ApiError(409, "Email already in use");

    if(user) {
        await issueVerificationOtp(user);
        user.password = password;
        await user.save();
    } else {
        user = await User.create({ email, password });
        await issueVerificationOtp(user);
    }

    res.status(201).json({
        success: true,
        message: "Verification code sent to your email",
        email: user.email
    });
}

export async function login(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if(!user || !(await user.matchPassword(password))) {
        throw new ApiError(401, "Invalid email or password");
    }

    if(!user.isEmailVerified) {
        throw new ApiError(403, "Please verify your email to continue", "EMAIL_NOT_VERIFIED")
    }

    const accessToken = await createSession(user, req, res);

    res.status(200).json({
        success: true,
        message: "Logged in successfully",
        user: {
            username: user.username ?? null,
            email: user.email
        },
        accessToken
    });
}

export async function logout(req, res) {
    const { sessionId } = req.auth;

    await Session.updateOne({ _id: sessionId }, { revoked: true });

    clearRefreshCookie(res);

    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
}

export async function logoutAll(req, res) {
    const { userId } = req.auth;

    await Session.updateMany(
        { user: userId, revoked: false }, 
        { revoked: true }
    );

    clearRefreshCookie(res);

    res.status(200).json({
        success: true,
        message: "Logged out from all devices successfully"
    });
}

export async function getMe(req, res) {
    const { userId } = req.auth;

    const user = await User.findById(userId).select("username email createdAt");
    if(!user) throw new ApiError(404, "User not found");

    res.status(200).json({
        success: true,
        user
    });
}

export async function refresh(req, res) {
    const incoming = req.cookies[REFRESH_COOKIE_NAME];
    if(!incoming) throw new ApiError(401, "Refresh token not found");

    const decoded = jwt.verify(incoming, config.JWT_REFRESH_SECRET);

    const session = await Session.findOne({
        _id: decoded.sessionId,
        refreshTokenHash: hashToken(incoming),
        revoked: false
    });
    if(!session) throw new ApiError(401, "Invalid refresh token");

    const newRefreshToken = signRefreshToken(decoded.id, session._id);
    session.refreshTokenHash = hashToken(newRefreshToken);
    session.expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
    await session.save();

    setRefreshCookie(res, newRefreshToken);

    res.status(200).json({
        success: true,
        message: "Access token refreshed successfully",
        accessToken: signAccessToken(decoded.id, session._id)
    });
}

export async function verifyEmail(req, res) {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if(!user || user.isEmailVerified) throw new ApiError(400, "Invalid or expired code");

    const otp = await Otp.findOneAndUpdate(
        {
            user: user._id,
            purpose: "email_verification",
            expiresAt: { $gt: new Date() },
            attempts: { $lt: OTP_MAX_ATTEMPTS }
        },
        { $inc: { attempts: 1 } },
        { new: true }
    );

    if(!otp) throw new ApiError(400, "Invalid or expired code. Please request a new one.");

    if(!isSameHash(otp.codeHash, hashOtp(user._id, code))) {
        const left = OTP_MAX_ATTEMPTS - otp.attempts;
        throw new ApiError(400, left > 0
            ? `Incorrect code. ${left} attempts left.`
            : "Incorrect code. No attempts left, please request a new code.");
    }

    const { deletedCount } = await Otp.deleteOne({ _id: otp._id });
    if(!deletedCount) throw new ApiError(400, "Invalid or expired code");

    user.isEmailVerified = true;
    await saveWithUsername(user);

    const accessToken = await createSession(user, req, res);

    res.status(200).json({
        success: true,
        message: "Email verified successfully",
        user: { email: user.email, username: user.username ?? null },
        accessToken
    });
}

export async function resendVerificationCode(req, res) {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if(user && !user.isEmailVerified) {
        await issueVerificationOtp(user);
    }

    res.status(200).json({
        success: true,
        message: "If this email is waiting for verification, a new code has been sent",
        cooldownSeconds: OTP_RESEND_COOLDOWN_MS / 1000 
    });
}

export async function setUsername(req, res) {
    const { username } = req.body;
    const { userId } = req.auth;

    const windowStart = new Date(Date.now() - USERNAME_CHANGE_WINDOW_MS);
    await User.updateOne({ _id: userId }, { $pull: { usernameChanges: { $lte: windowStart } } });

    let user;
    try {
        user = await User.findOneAndUpdate(
            { 
                _id: userId, 
                username: { $ne: username },
                [`usernameChanges.${USERNAME_CHANGE_LIMIT - 1}`]: { $exists: false }
            },
            { $set: { username }, $push: { usernameChanges: new Date() } },
            { new: true }
        );
    } catch(err) {
        if(err.code === 11000) {
            throw new ApiError(409, "This username is already taken", "USERNAME_TAKEN");
        }
        throw err;
    }

    if(!user) {
        const current = await User.findById(userId).select("username usernameChanges");
        if(!current) throw new ApiError(404, "User not found");

        if(current.username === username) {
            throw new ApiError(400, "That is already your username");
        }

        const oldest = current.usernameChanges[0] ?? new Date();
        const retryAt = new Date(oldest.getTime() + USERNAME_CHANGE_WINDOW_MS);

        throw new ApiError(
            429,
            `You can change your username ${USERNAME_CHANGE_LIMIT} times every 3 days. Try again after ${retryAt.toISOString()}`,
            "USERNAME_CHANGE_LIMIT"
        );
    }

    res.status(200).json({
        success: true,
        message: "Username changed successfully",
        user: { email: user.email, username: user.username }
    });
}
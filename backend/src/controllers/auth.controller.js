import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import config from "../config/config.js";
import jwt from "jsonwebtoken";
import Session from "../models/session.model.js";
import crypto from "crypto";

export async function register(req, res) {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if(existingUser) throw new ApiError(409, "Username or email already in use");

    const user = await User.create({
        username,
        email,
        password
    }); // user created even if error comes later below the code

    const refreshToken = jwt.sign(
        { id: user._id },
        config.JWT_SECRET,
        { expiresIn: "7d" }
    );

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await Session.create({
        user: user._id,
        refreshTokenHash,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    });

    const accessToken = jwt.sign(
        { id: user._id, sessionId: session._id },
        config.JWT_SECRET,
        { expiresIn: "15m" }
    );

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
            username,
            email
        },
        accessToken
    });
}

export async function login(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if(!user) throw new ApiError(401, "Invalid email or password");

    if(!user.matchPassword(password)) throw new ApiError(401, "Invalid email or password");

    const refreshToken = jwt.sign(
        { id: user._id },
        config.JWT_SECRET,
        { expiresIn: "7d" }
    );

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await Session.create({
        user: user._id,
        refreshTokenHash,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    });

    const accessToken = jwt.sign(
        { id: user._id, sessionId: session._id },
        config.JWT_SECRET,
        { expiresIn: "15m" }
    );

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
        success: true,
        message: "Logged in successfully",
        user: {
            username: user.username,
            email: user.email
        },
        accessToken
    });
}

export async function logout(req, res) {
    const { refreshToken } = req.cookies;

    if(!refreshToken) throw new ApiError(400, "Refresh token not found");

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await Session.findOne({ refreshTokenHash, revoked: false });

    if(!session) throw new ApiError(400, "Invalid refresh token");

    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken");

    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
}

export async function logoutAll(req, res) {
    const { refreshToken } = req.cookies;

    if(!refreshToken) throw new ApiError(400, "Refresh token not found")

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET); // shouldnt accessToken decoded be used

    await Session.updateMany(
        {
            user: decoded.id,
            revoked: false
        }, 
        {
            revoked: true
        }
    );

    res.clearCookie("refreshToken");

    res.status(200).json({
        success: true,
        message: "Logged out from all devices successfully"
    });
}

export async function getMe(req, res) {

}

export async function refreshToken(req, res) {
    const { refreshToken } = req.cookies;

    if(!refreshToken) throw new ApiError(401, "Refresh token not found");

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await Session.findOne({ refreshTokenHash, revoked: false });

    if(!session) throw new ApiError(401, "Invalid refresh token");

    const newRefreshToken = jwt.sign(
        { id: decoded.id },
        config.JWT_SECRET,
        { expiresIn: "7d" }
    );

    const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

    const accessToken = jwt.sign(
        { id: decoded.id }, // session id here too?
        config.JWT_SECRET,
        { expiresIn: "15m" }
    );

    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
        success: true,
        message: "Access token refreshed successfully",
        accessToken
    })
}
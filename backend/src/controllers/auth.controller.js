import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import { ApiError } from "../utils/ApiError.js";
import { createSession } from "../utils/session.js";
import config from "../config/config.js";
import { 
    clearRefreshCookie, REFRESH_COOKIE_NAME, REFRESH_TTL_MS, signAccessToken, signRefreshToken, setRefreshCookie 
} from "../utils/token.js";



export async function register(req, res) {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if(existingUser) throw new ApiError(409, "Username or email already in use");

    const user = await User.create({
        username,
        email,
        password
    }); 

    res.status(201).json({
        success: true,
        message: "Account created successfully",
        user: {
            username: user.username,
            email: user.email
        }
    });
}

export async function login(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    const isMatch = await user.matchPassword(password);

    if(!user || !isMatch) {
        throw new ApiError(401, "Invalid email or password");
    }

    const accessToken = createSession(user, req, res);

    res.status(200).json({
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
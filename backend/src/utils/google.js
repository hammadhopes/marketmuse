import { OAuth2Client } from "google-auth-library";
import config from "../config/config.js";
import { isSameHash } from "./otp.js";


export const googleClient = new OAuth2Client({
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    redirectUri: config.GOOGLE_REDIRECT_URI
});

export const GOOGLE_STATE_COOKIE = "google_oauth";

export const googleStateCookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    path: "/api/auth/google/callback",
    maxAge: 10 * 60 * 1000
};

export async function getGoogleProfile(req, res) {
    const { code, state, error } = req.query;

    const raw = req.cookies[GOOGLE_STATE_COOKIE];
    res.clearCookie(GOOGLE_STATE_COOKIE, googleStateCookieOptions);

    if(error) throw new Error(`Google returned an error: ${error}`);
    if(typeof code !== "string" || typeof state !== "string") throw new Error("Missing code or state");
    if(!raw) throw new Error("Missing state cookie");

    let saved;
    try {
        saved = JSON.parse(raw);
    } catch {
        throw new Error("Malformed state cookie");
    }

    if(typeof saved?.state !== "string" || typeof saved?.codeVerifier !== "string") {
        throw new Error("Malformed state cookie");
    }

    if(!isSameHash(saved.state, state)) throw new Error("State mismatched");

    const { tokens } = await googleClient.getToken({ code, codeVerifier: saved.codeVerifier });
    if(!tokens.id_token) throw new Error("No ID token returned");

    const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: config.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if(!payload?.sub || !payload.email) throw new Error("ID token is missing sub or email");
    if(!payload.email_verified) throw new Error("Google email is not verified");

    return {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name ?? null
    };
}
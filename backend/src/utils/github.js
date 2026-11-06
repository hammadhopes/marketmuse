import crypto from "crypto";
import config from "../config/config.js";
import { isSameHash } from "./otp.js";


const GITHUB_TIMEOUT_MS = 10_000;
export const GITHUB_STATE_COOKIE = "github_oauth";

export const githubStateCookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    path: "/api/auth/github/callback",
    maxAge: 10 * 60 * 1000
};

export function createPkcePair() {
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    return { codeVerifier, codeChallenge };
}

export function buildGithubAuthUrl({ state, codeChallenge }) {
    const params = new URLSearchParams({
        client_id: config.GITHUB_CLIENT_ID,
        redirect_uri: config.GITHUB_REDIRECT_URI,
        scope: "user:email",
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256"
    });

    return `https://github.com/login/oauth/authorize?${params}`;
}

async function githubFetch(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: { Accept: "application/json", "User-Agent": "MarketMuse", ...options.headers },
        signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS)
    });

    if(!res.ok) throw new Error(`GitHub request failed with status ${res.status}`);
    return res.json();
}

export async function getGithubProfile(req, res) {
    const { code, state, error } = req.query;

    const raw = req.cookies[GITHUB_STATE_COOKIE];
    res.clearCookie(GITHUB_STATE_COOKIE, githubStateCookieOptions);

    if(error) throw new Error(`Github returned an error: ${error}`);
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

    if(!isSameHash(saved.state, state)) throw new Error("State mismatch");

    const tokenData = await githubFetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        body: new URLSearchParams({
            client_id: config.GITHUB_CLIENT_ID,
            client_secret: config.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: config.GITHUB_REDIRECT_URI,
            code_verifier: saved.codeVerifier
        })
    });

    if(tokenData.error || !tokenData.access_token) {
        throw new Error(`Token exchange failed: ${tokenData.error ?? "no access token"}`);
    }

    const headers = {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json"
    };

    const [user, emails] = await Promise.all([
        githubFetch("https://api.github.com/user", { headers }),
        githubFetch("https://api.github.com/user/emails", { headers })
    ]);

    if(user?.id === undefined || user?.id === null) throw new Error("GitHub profile has no id");
    if(!Array.isArray(emails)) throw new Error("Unexpected response from /user/emails");

    const primary = emails.find((e) => e.primary && e.verified);
    if(!primary) throw new Error("GitHub account has no verified primary email");

    return {
        githubId: String(user.id), 
        email: primary.email.toLowerCase()
    };
}
import Otp from "../models/otp.model.js";
import { ApiError } from "./ApiError.js";
import { generateOtp, hashOtp, OTP_TTL_MS, OTP_RESEND_COOLDOWN_MS } from "./otp.js";
import { sendVerificationEmail } from "./email.js";

const PURPOSE = "email_verification";

export async function issueVerificationOtp(user) {
    const existing = await Otp.findOne({ user: user._id, purpose: PURPOSE });

    if(existing && Date.now() - existing.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
        throw new ApiError(429, "Please wait a minute before requesting a new code");
    }

    const code = generateOtp();

    await Otp.deleteOne({ user: user._id, purpose: PURPOSE });

    const otp = await Otp.create({
        user: user._id,
        purpose: PURPOSE,
        codeHash: hashOtp(user._id, code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS)
    });

    try {
        await sendVerificationEmail(user.email, code);
    } catch(err) {
        console.error("Failed to send verification email:", err.message);
        await Otp.deleteOne({ _id: otp._id });
        throw new ApiError(502, "Could not send the verification email. Please try again.")
    }
}
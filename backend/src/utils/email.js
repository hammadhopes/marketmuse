import nodemailer from "nodemailer";
import config from "../config/config.js";
import { OTP_TTL_MS } from "./otp.js";


const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000
});

async function sendEmail({ to, subject, text, html }) {
    const info = await transporter.sendMail({ from: config.EMAIL_FROM, to, subject, text, html });

    if(!config.isProduction) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if(previewUrl) console.log("Email preview:", previewUrl);
    }
}

export async function sendVerificationEmail(to, code) {
    const minutes = OTP_TTL_MS / 60_000;

    await sendEmail({
        to,
        subject: `${code} is your MarketMuse verification code`,
        text: `Your MarketMuse verification code is ${code}. It expires in ${minutes} minutes. If you didn't create an account, you can ignore this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 420px; margin: 0 auto;">
                <h2>Verify your email</h2>
                <p>Enter this code to finish creating your MarketMuse account:</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</p>
                <p>It expires in ${minutes} minutes.</p>
                <p style="color: #666; font-size: 13px;">If you didn't create an account, you can ignore this email.</p>
            </div>`
    });
}
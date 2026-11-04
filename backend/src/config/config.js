import "dotenv/config";

const required = [
    "MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "OTP_SECRET",
    "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"
];

for(const key of required) {
    if(!process.env[key]) throw new Error(`${key} is not defined in environment variables`);
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    OTP_SECRET: process.env.OTP_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: Number(process.env.SMTP_PORT), 
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    isProduction: process.env.NODE_ENV === "production"
};

export default config;
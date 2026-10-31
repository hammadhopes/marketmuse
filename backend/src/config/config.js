import "dotenv/config";

const required = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

for(const key of required) {
    if(!process.env[key]) throw new Error(`${key} is not defined in environment variables`);
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    isProduction: process.env.NODE_ENV === "production"
};

export default config;
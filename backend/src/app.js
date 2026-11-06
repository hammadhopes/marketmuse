import express from "express";
import connectDatabase from "./config/database.js";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import config from "./config/config.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { apiLimiter } from "./middlewares/rateLimit.middleware.js";

const app = express();

// MIDDLEWARES
app.set("trust proxy", config.TRUST_PROXY);
app.use(helmet());
app.use("/api", apiLimiter);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// ROUTES
app.use("/api/auth", authRouter);

// ERROR HANDLER MIDDLEWARE
app.use(errorHandler);

app.listen(3000, () => {
    console.log("App is listening on port 3000");
    connectDatabase();
});
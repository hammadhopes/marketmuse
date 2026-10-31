import express from "express";
import connectDatabase from "./config/database.js";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// MIDDLEWARES
app.use(express.json());
app.use(cookieParser());

// ROUTES
app.use("/api/auth", authRouter);

// ERROR HANDLER MIDDLEWARE
app.use(errorHandler);

app.listen(3000, () => {
    console.log("App is listening on port 3000");
    connectDatabase();
});
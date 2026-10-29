import express from "express";
import connectDatabase from "./config/database.js";

const app = express();

app.listen(3000, () => {
    console.log("App is listening on port 3000");
    connectDatabase();
});
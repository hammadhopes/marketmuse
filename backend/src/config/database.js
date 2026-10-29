import mongoose from "mongoose";
import config from "./config.js";

async function connectDatabase() {
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to Database");
}

export default connectDatabase;
import mongoose from "mongoose";

const identitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    provider: {
        type: String,
        enum: ["google", "github"],
        required: true
    },
    providerId: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    }
}, { timestamps: true });

identitySchema.index({ provider: 1, providerId: 1 }, { unique: true });
identitySchema.index({ user: 1, provider: 1 }, { unique: true });

const Identity = mongoose.model("Identity", identitySchema);
export default Identity;
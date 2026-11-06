import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    usernameChanges: {
        type: [Date],
        default: []
    }
}, { timestamps: true });


userSchema.pre("save", async function() {
    if(!this.isModified("password") || !this.password) return;
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = function(enteredPassword) {
    if(!this.password) return false;
    return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
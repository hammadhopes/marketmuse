import User from "../models/user.model.js";
import Identity from "../models/identity.model.js";
import Otp from "../models/otp.model.js";
import { saveWithUsername } from "./username.js";


export async function findOrCreateOAuthUser({ provider, providerId, email }) {
    const identity = await Identity.findOne({ provider, providerId });
    if(identity) {
        const existing = await User.findById(identity.user);
        if(existing) return { user: existing, isNew: false };

        await Identity.deleteOne({ _id: identity._id });
    }

    let user = await User.findOne({ email });

    if(user && !user.isEmailVerified) {
        const { deletedCount } = await User.deleteOne({ _id: user._id, isEmailVerified: false });
        
        if(deletedCount) {
            await Otp.deleteMany({ user: user._id });
            user = null;
        } else {
            user = await User.findOne({ email });
        }
    } 
    
    let isNew = false;
    if(!user) {
        user = new User({ email, isEmailVerified: true });
        await saveWithUsername(user);
        isNew = true;
    }

    await Identity.create({ user: user._id, provider, providerId, email });

    return { user, isNew };
}
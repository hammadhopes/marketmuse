import crypto from "crypto";

const ADJECTIVES = [
    "brave", "calm", "clever", "cosmic", "eager", "fancy", "gentle", "happy", "jolly", "keen",
    "lively", "lucky", "mellow", "nimble", "proud", "quick", "quiet", "royal", "shiny", "silent",
    "smart", "snowy", "sunny", "swift", "tidy", "vivid", "warm", "wild", "witty", "zesty"
];

const NOUNS = [
    "otter", "falcon", "panda", "tiger", "maple", "comet", "river", "cloud", "ember", "fox",
    "koala", "lynx", "meteor", "orbit", "pixel", "raven", "robin", "spark", "storm", "willow",
    "wolf", "yak", "zebra", "badger", "cobra", "dragon", "eagle", "gecko", "heron", "lemur"
];

const MAX_USERNAME_ATTEMPTS = 5;
export const USERNAME_CHANGE_LIMIT = 3;
export const USERNAME_CHANGE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const pick = (list) => {
    return list[crypto.randomInt(list.length)];
};


export const generateUsername = () => {
    return `${pick(ADJECTIVES)}_${pick(NOUNS)}_${crypto.randomInt(1000, 10000)}`;
};

export async function saveWithUsername(user) {
    if(user.username) {
        await user.save();
        return;
    }

    for(let attempt = 1; attempt <= MAX_USERNAME_ATTEMPTS; attempt++) {
        user.username = generateUsername();

        try {
            await user.save();
            return;
        } catch(err) {
            const usernameClash = err.code === 11000 && Boolean(err.keyPattern?.username);

            if(!usernameClash || attempt === MAX_USERNAME_ATTEMPTS) throw err;
        }
    }
}
require("dotenv").config();
const { User, Daily } = require("./mongodb.js");

module.exports = {
    DAILY_COOLDOWN: 86400000, // 24h

    async getDaily(userId, guildId) {
        let daily = await Daily.findOne({ userId, guildId });
        if (!daily) {
            daily = new Daily({ userId, guildId, lastClaim: 0 });
            await daily.save();
        }
        return daily;
    },

    async claim(userId, guildId, reward) {
        const now = Date.now();
        const daily = await this.getDaily(userId, guildId);
        daily.lastClaim = now;
        await daily.save();

        // También sumar dinero al usuario
        const user = await User.findOne({ userId, guildId });
        if (user) {
            user.money += reward;
            await user.save();
        }

        return now;
    }
};

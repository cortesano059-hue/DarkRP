require("dotenv").config();
const { User, Work } = require("./mongodb.js");

module.exports = {
    WORK_COOLDOWN: 3600000, // 1h

    async getWork(userId, guildId) {
        let work = await Work.findOne({ userId, guildId });
        if (!work) {
            work = new Work({ userId, guildId, lastWork: 0 });
            await work.save();
        }
        return work;
    },

    async setWork(userId, guildId) {
        const now = Date.now();
        const work = await this.getWork(userId, guildId);
        work.lastWork = now;
        await work.save();
        return now;
    }
};

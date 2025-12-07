const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    money: { type: Number, default: 0 },
    bank: { type: Number, default: 5000 },
    daily_claim_at: { type: Number, default: 0 },
    work_cooldown: { type: Number, default: 0 }
}, { timestamps: true });

// Índice único por usuario + servidor
userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

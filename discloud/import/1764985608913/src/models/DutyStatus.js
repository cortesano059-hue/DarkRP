const mongoose = require('mongoose');

const dutyStatusSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    onDuty: { type: Boolean, default: false },
    startTime: { type: Date, default: null }
});

// Índice único por usuario + servidor
dutyStatusSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.models.DutyStatus || mongoose.model('DutyStatus', dutyStatusSchema);

const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    amount: { type: Number, default: 1 }
});

// Índice único por usuario + servidor + item
inventorySchema.index({ userId: 1, guildId: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);

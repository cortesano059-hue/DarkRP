const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    guildId: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, default: 0 },
    type: { type: String, default: 'misc' },   // Categoría
    emoji: { type: String, default: '📦' },    // Emoji por defecto
    data: { type: Object, default: {} }       // Para datos extra
});

// Índice único por nombre + servidor
itemSchema.index({ itemName: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.models.Item || mongoose.model('Item', itemSchema);

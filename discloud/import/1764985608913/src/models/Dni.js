const mongoose = require('mongoose');

const dniSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    dni: { type: String, required: true },
    nombre: { type: String, default: '' },
    apellido: { type: String, default: '' },
    edad: { type: Number, default: null },
    nacionalidad: { type: String, default: '' },
    psid: { type: String, default: '' },
    guildId: { type: String, default: null }
});

// Índice único por usuario + servidor
dniSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.models.Dni || mongoose.model('Dni', dniSchema);

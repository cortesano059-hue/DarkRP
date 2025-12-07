// src/models/Backpack.js
const mongoose = require("mongoose");

const backpackSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true },
    ownerId: { type: String, required: true },

    // Nombre único por owner+guild (case-insensitive via RegExp)
    name: { type: String, required: true },

    emoji: { type: String, default: "🎒" },
    description: { type: String, default: "" },

    // Capacidad en slots (items distintos)
    capacity: { type: Number, default: 15 },

    // Control de permisos
    accessType: {
      type: String,
      enum: ["owner_only", "custom"],
      default: "owner_only"
    },

    allowedUsers: { type: [String], default: [] },
    allowedRoles: { type: [String], default: [] },

    // Items guardados
    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
        amount: { type: Number, default: 1 }
      }
    ]
  },
  { timestamps: true }
);

// unique por dueño + nombre
backpackSchema.index({ guildId: 1, ownerId: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.Backpack || mongoose.model("Backpack", backpackSchema);
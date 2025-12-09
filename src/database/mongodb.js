// src/database/mongodb.js
const mongoose = require("mongoose");

/* ==============================
   CONEXIÓN A MONGO
============================== */

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.error("❌ Error MongoDB:", err));

function getModel(name, schema) {
  return mongoose.models[name] || mongoose.model(name, schema);
}

/* ==============================
   USUARIOS
============================== */

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },

    money: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },

    daily_claim_at: { type: Number, default: 0 },
    work_cooldown: { type: Number, default: 0 },
    trash_cooldown: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ userId: 1, guildId: 1 }, { unique: true });
const User = getModel("User", userSchema);

/* ==============================
   ITEMS
============================== */

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  guildId: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, default: 0 },
  type: { type: String, default: "misc" },
  emoji: { type: String, default: "📦" },
  data: { type: Object, default: {} },
});

itemSchema.index({ itemName: 1, guildId: 1 }, { unique: true });
const Item = getModel("Item", itemSchema);

/* ==============================
   INVENTARIO
============================== */

const inventorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  amount: { type: Number, default: 1 },
});

inventorySchema.index({ userId: 1, guildId: 1, itemId: 1 }, { unique: true });
const Inventory = getModel("Inventory", inventorySchema);

/* ==============================
   MOCHILAS
============================== */

const backpackSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true },
    ownerId: { type: String, required: true },
    name: { type: String, required: true },
    emoji: { type: String, default: "🎒" },
    description: { type: String, default: "" },
    capacity: { type: Number, default: 15 },
    accessType: {
      type: String,
      enum: ["owner_only", "custom"],
      default: "owner_only",
    },
    allowedUsers: { type: [String], default: [] },
    allowedRoles: { type: [String], default: [] },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        amount: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

backpackSchema.index({ guildId: 1, ownerId: 1, name: 1 }, { unique: true });
const Backpack = getModel("Backpack", backpackSchema);

/* ==============================
   DUTY STATUS
============================== */

const dutyStatusSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  roleId: { type: String, required: true }, // EL ROL QUE SE LE ASIGNÓ AUTOMÁTICAMENTE
  startTime: { type: Number, required: true }, // EN TIMESTAMP MS
});

dutyStatusSchema.index({ userId: 1, guildId: 1 }, { unique: true });
const DutyStatus = getModel("DutyStatus", dutyStatusSchema);

/* ==============================
   INCOME ROLES (NUEVO)
============================== */

const incomeRoleSchema = new mongoose.Schema({
  roleId: { type: String, required: true },
  guildId: { type: String, required: true },
  incomePerHour: { type: Number, required: true },
});

incomeRoleSchema.index({ roleId: 1, guildId: 1 }, { unique: true });
const IncomeRole = getModel("IncomeRole", incomeRoleSchema);

/* ==============================
   DNI
============================== */

const dniSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  dni: { type: String, required: true },
  nombre: { type: String, default: "" },
  apellido: { type: String, default: "" },
  edad: { type: Number, default: null },
  nacionalidad: { type: String, default: "" },
  psid: { type: String, default: "" },
  guildId: { type: String, default: null },
});

dniSchema.index({ userId: 1 }, { unique: true });
const Dni = getModel("Dni", dniSchema);

/* ==============================
   EXPORTS (FINAL)
============================== */

module.exports = {
  mongoose,
  User,
  Item,
  Inventory,
  Backpack,
  DutyStatus,
  IncomeRole,
  Dni,
};

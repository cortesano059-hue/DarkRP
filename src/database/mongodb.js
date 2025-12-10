const mongoose = require("mongoose");

/* =========================================================
   ⚠ SISTEMA ANTI-BLOQUEO PARA register.js
   Solo conectar a MongoDB cuando el bot esté ejecutándose.
   register.js NO debe conectar a la base de datos.
========================================================= */
if (process.env.RUNNING_BOT === "true") {
  mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    })
    .then(() => console.log("✅ MongoDB conectado"))
    .catch((err) => console.error("❌ Error MongoDB:", err));
}

/* ==============================
   FUNCIÓN INTERNA getModel()
============================== */
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
   ITEM SYSTEM — ESTILO UNBELIEVABOAT
============================== */

const requirementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["role", "balance", "item"],
    required: true,
  },

  // ROLE requirement
  roleId: String,
  mustHave: Boolean, // true = debe tenerlo, false = debe NO tenerlo

  // BALANCE requirement
  balanceType: { type: String, enum: ["money", "bank"] },
  operator: { type: String, enum: [">=", "<=", "=", ">", "<"] },
  amount: Number,

  // ITEM requirement
  itemNameRequired: String,
  itemAmountRequired: Number,

  applicableTo: {
    type: String,
    enum: ["buy", "use", "both"],
    default: "both",
  },
});

const actionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["message", "roles", "balance", "items"],
    required: true,
  },

  /* MENSAJE */
  messageText: String,
  embed: { type: Boolean, default: false },

  /* ROLES */
  addRoles: [String],
  removeRoles: [String],

  /* BALANCE modifications */
  money: Number, // positivo o negativo
  bank: Number, // positivo o negativo

  /* ITEMS modifications */
  giveItem: String,
  giveAmount: Number,
  removeItem: String,
  removeAmount: Number,
});

const itemSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  itemName: { type: String, required: true },

  description: { type: String, default: "" },
  price: { type: Number, default: 0 },
  emoji: { type: String, default: "📦" },

  usable: { type: Boolean, default: false },
  inventory: { type: Boolean, default: true },
  sellable: { type: Boolean, default: true },

  stock: { type: Number, default: -1 }, // -1 = ilimitado
  timeLimit: { type: Number, default: 0 }, // 0 = sin caducidad

  requirements: [requirementSchema],
  actions: [actionSchema],

  data: { type: Object, default: {} },
});

itemSchema.index({ guildId: 1, itemName: 1 }, { unique: true });
const Item = getModel("Item", itemSchema);

/* ==============================
   INVENTARIO
============================== */
const inventorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },
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

    allowedUsers: [String],
    allowedRoles: [String],

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

  roleId: { type: String, required: true },
  startTime: { type: Date, required: true },
  lastPayment: { type: Date, required: true },
  channelId: { type: String },
});

dutyStatusSchema.index({ userId: 1, guildId: 1 }, { unique: true });
const DutyStatus = getModel("DutyStatus", dutyStatusSchema);

/* ==============================
   RANGOS DE INGRESOS
============================== */
const incomeRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  roleId: { type: String, required: true },
  incomePerHour: { type: Number, required: true },
});

incomeRoleSchema.index({ guildId: 1, roleId: 1 }, { unique: true });
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
   EXPORTAR
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

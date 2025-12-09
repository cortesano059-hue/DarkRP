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

    // Cooldowns persistentes
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
   DUTY STATUS (ON DUTY SYSTEM)
============================== */

const dutyStatusSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },

  roleId: { type: String, required: true }, // Rol elegido según jerarquía
  startTime: { type: Date, required: true }, // Cuando entró a servicio
  lastPayment: { type: Date, required: true }, // Último pago automático
  channelId: { type: String, required: false }, // Canal donde avisar
});

dutyStatusSchema.index({ userId: 1, guildId: 1 }, { unique: true });

const DutyStatus = getModel("DutyStatus", dutyStatusSchema);

/* ==============================
   INCOME ROLES (SUELDOS)
============================== */

const incomeRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  roleId: { type: String, required: true },
  incomePerHour: { type: Number, required: true }, // salario por hora
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
   EXPORTS
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

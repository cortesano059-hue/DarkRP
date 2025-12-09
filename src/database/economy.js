// src/database/economy.js
require("dotenv").config();
const { User, Item, Inventory, Backpack } = require("./mongodb.js");
const logger = require("@logger"); // Para el log de transacciones

module.exports = {
  DAILY_COOLDOWN: 86400000, // 24 horas

  /* ==============================
     OBTENER USUARIO
  ============================== */
  async getUser(userId, guildId) {
    if (!userId || !guildId) return null;

    const user = await User.findOneAndUpdate(
      { userId, guildId },
      {
        $setOnInsert: {
          userId,
          guildId,
          money: 0,
          bank: 5000,
          daily_claim_at: 0,
          work_cooldown: 0,
          trash_cooldown: 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    user.work_cooldown = Number(user.work_cooldown) || 0;
    user.daily_claim_at = Number(user.daily_claim_at) || 0;
    user.trash_cooldown = Number(user.trash_cooldown) || 0;

    await user.save();

    return user;
  },

  /* ==============================
     BALANCE
  ============================== */
  async getBalance(userId, guildId) {
    const user = await this.getUser(userId, guildId);
    if (!user) return null;

    return {
      balance: user.money,
      bank: user.bank,
      dailyClaim: Number(user.daily_claim_at) || 0,
      workCooldown: Number(user.work_cooldown) || 0,
      trashCooldown: Number(user.trash_cooldown) || 0,
    };
  },

  /* ==============================
     DINERO
  ============================== */
  async addMoney(userId, guildId, amount, from = 'system') {
    const user = await this.getUser(userId, guildId);
    if (!user) return false;

    const finalAmount = Number(amount);
    if (finalAmount <= 0) return false;

    user.money += finalAmount;
    await user.save();
    
    logger.logTransaction({ 
        userId, 
        guildId, 
        type: from, 
        amount: finalAmount, 
        to: 'money' 
    });

    return user.money;
  },

  async removeMoney(userId, guildId, amount, from = 'system') {
    const user = await this.getUser(userId, guildId);
    if (!user) return { success: false, message: "Usuario no encontrado." };

    const finalAmount = Number(amount);

    if (user.money < finalAmount)
      return { success: false, message: "No tienes suficiente dinero." };

    user.money -= finalAmount;
    await user.save();

    logger.logTransaction({ 
        userId, 
        guildId, 
        type: from, 
        amount: -finalAmount, 
        from: 'money' 
    });

    return { success: true };
  },

  async deposit(userId, guildId, amount) {
    const user = await this.getUser(userId, guildId);
    if (!user) return { success: false };

    const finalAmount = Number(amount);

    if (user.money < finalAmount)
      return { success: false, message: "No tienes suficiente dinero." };

    user.money -= finalAmount;
    user.bank += finalAmount;
    await user.save();

    logger.logTransaction({ 
        userId, 
        guildId, 
        type: 'deposit', 
        amount: finalAmount, 
        from: 'money', 
        to: 'bank' 
    });

    return { success: true };
  },

  async withdraw(userId, guildId, amount) {
    const user = await this.getUser(userId, guildId);
    if (!user) return { success: false };

    const finalAmount = Number(amount);

    if (user.bank < finalAmount)
      return { success: false, message: "No tienes suficiente banco." };

    user.bank -= finalAmount;
    user.money += finalAmount;
    await user.save();

    logger.logTransaction({ 
        userId, 
        guildId, 
        type: 'withdraw', 
        amount: finalAmount, 
        from: 'bank', 
        to: 'money'
    });

    return { success: true };
  },

  /* ==============================
     COOLDOWN DAILY / WORK
  ============================== */
  async claimDaily(userId, guildId) {
    const user = await this.getUser(userId, guildId);
    if (!user) return null;

    user.daily_claim_at = Date.now();
    await user.save();
    return user.daily_claim_at;
  },

  async setWorkCooldown(userId, guildId, timestamp) {
    const user = await this.getUser(userId, guildId);
    if (!user) return null;

    const cleanTimestamp = Number(timestamp) || Date.now();
    user.work_cooldown = cleanTimestamp;
    await user.save();

    return user.work_cooldown;
  },

  async getWorkCooldown(userId, guildId) {
    const user = await this.getUser(userId, guildId);
    if (!user) return 0;
    return Number(user.work_cooldown) || 0;
  },

  /* ==============================
     COOLDOWN TRASH
  ============================== */
  async setTrashCooldown(userId, guildId, timestamp) {
    const user = await this.getUser(userId, guildId);
    if (!user) return null;

    const cleanTimestamp = Number(timestamp) || Date.now();
    user.trash_cooldown = cleanTimestamp;
    await user.save();

    return user.trash_cooldown;
  },

  async getTrashCooldown(userId, guildId) {
    const user = await this.getUser(userId, guildId);
    if (!user) return 0;

    return Number(user.trash_cooldown) || 0;
  },

  // Aquí seguirían tus funciones de inventario y tienda originales
};

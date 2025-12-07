// src/database/economy.js
require("dotenv").config();
const { User, Item, Inventory, Backpack } = require("./mongodb.js");

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
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 🔥 FIX: convertir a número por si hay datos corruptos en BD
    user.work_cooldown = Number(user.work_cooldown) || 0;
    user.daily_claim_at = Number(user.daily_claim_at) || 0;

    // Si estaba corrupto, lo re-guardamos limpio
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
    };
  },

  /* ==============================
     DINERO
  ============================== */
  async addMoney(userId, guildId, amount) {
    const user = await this.getUser(userId, guildId);
    if (!user) return false;

    user.money += Number(amount);
    await user.save();
    return user.money;
  },

  async removeMoney(userId, guildId, amount) {
    const user = await this.getUser(userId, guildId);
    if (!user)
      return { success: false, message: "Usuario no encontrado." };

    if (user.money < amount)
      return { success: false, message: "No tienes suficiente dinero." };

    user.money -= Number(amount);
    await user.save();

    return { success: true };
  },

  async deposit(userId, guildId, amount) {
    const user = await this.getUser(userId, guildId);
    if (!user) return { success: false };

    if (user.money < amount)
      return { success: false, message: "No tienes suficiente dinero." };

    user.money -= Number(amount);
    user.bank += Number(amount);
    await user.save();

    return { success: true };
  },

  async withdraw(userId, guildId, amount) {
    const user = await this.getUser(userId, guildId);
    if (!user) return { success: false };

    if (user.bank < amount)
      return { success: false, message: "No tienes suficiente banco." };

    user.bank -= Number(amount);
    user.money += Number(amount);
    await user.save();

    return { success: true };
  },

  /* ==============================
     SHOP
  ============================== */
  async getShop(guildId) {
    return await Item.find({ guildId });
  },

  async getItemByName(guildId, name) {
    return Item.findOne({
      guildId,
      itemName: new RegExp(`^${name}$`, "i"),
    });
  },

  async createItem(
    guildId,
    name,
    { description = "", price = 0, type = "misc", emoji = "📦", data = {} }
  ) {
    const item = new Item({
      guildId,
      itemName: name,
      description,
      price,
      type,
      emoji,
      data,
    });
    await item.save();
    return item;
  },

  async editItem(
    guildId,
    name,
    { newName, newDescription, newPrice, newEmoji, newType }
  ) {
    const item = await this.getItemByName(guildId, name);
    if (!item) throw new Error("Item no encontrado.");

    if (newName) item.itemName = newName;
    if (newDescription) item.description = newDescription;
    if (newPrice !== undefined) item.price = newPrice;
    if (newEmoji) item.emoji = newEmoji;
    if (newType) item.type = newType;

    await item.save();
    return item;
  },

  /* ==============================
     INVENTARIO
  ============================== */
  async getUserInventory(userId, guildId) {
    const inventory = await Inventory.find({
      userId,
      guildId,
      amount: { $gt: 0 },
    }).populate("itemId");

    return inventory.map((inv) => ({
      id: inv.itemId._id,
      name: inv.itemId.itemName,
      description: inv.itemId.description,
      emoji: inv.itemId.emoji,
      type: inv.itemId.type,
      amount: inv.amount,
    }));
  },

  async addToInventory(userId, guildId, itemId, amount = 1) {
    return Inventory.findOneAndUpdate(
      { userId, guildId, itemId },
      { $inc: { amount } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  },

  async removeItem(userId, guildId, itemName, amount = 1) {
    const item = await this.getItemByName(guildId, itemName);
    if (!item) throw new Error("Item no existe.");

    const entry = await Inventory.findOne({
      userId,
      guildId,
      itemId: item._id,
    });

    if (!entry || entry.amount < amount)
      throw new Error("No tienes suficiente cantidad.");

    entry.amount -= Number(amount);

    if (entry.amount <= 0) await entry.deleteOne();
    else await entry.save();

    return true;
  },

  async buyItemByName(userId, guildId, itemName) {
    const item = await this.getItemByName(guildId, itemName);
    if (!item)
      return { success: false, message: "El item no existe." };

    const user = await this.getUser(userId, guildId);
    if (!user)
      return { success: false, message: "Error de usuario." };

    if (user.money < item.price)
      return {
        success: false,
        message: "No tienes suficiente dinero.",
      };

    user.money -= Number(item.price);
    await user.save();

    await this.addToInventory(userId, guildId, item._id);

    return {
      success: true,
      item: {
        name: item.itemName,
        emoji: item.emoji,
        price: item.price,
        description: item.description,
      },
    };
  },

  /* ==============================
     COOLDOWN WORK
  ============================== */
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
     DAILY
  ============================== */
  async claimDaily(userId, guildId) {
    const user = await this.getUser(userId, guildId);
    if (!user) return null;

    const now = Date.now();

    user.daily_claim_at = Number(now);
    await user.save();

    return user.daily_claim_at;
  },
};

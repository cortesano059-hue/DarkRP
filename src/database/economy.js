// src/database/economy.js
require("dotenv").config();
const { User, Item, Inventory } = require("./mongodb.js");
const logger = require("@logger");

/* ========================================================================
   SISTEMA DE ECONOMÍA COMPLETO (REPARADO)
=========================================================================== */

module.exports = {
    DAILY_COOLDOWN: 86400000, // 24h

    /* ========================================================================
       USUARIOS
    ======================================================================== */

    async getUser(userId, guildId) {
        if (!userId || !guildId) return null;

        return await User.findOneAndUpdate(
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
                }
            },
            { new: true, upsert: true }
        );
    },

    async getBalance(userId, guildId) {
        const user = await this.getUser(userId, guildId);
        if (!user) return null;

        return {
            money: user.money,
            bank: user.bank,
            dailyClaim: user.daily_claim_at,
            workCooldown: user.work_cooldown,
            trashCooldown: user.trash_cooldown,
        };
    },

    /* ========================================================================
       DINERO
    ======================================================================== */

    async addMoney(userId, guildId, amount, from = "system") {
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
            to: "money",
        });

        return user.money;
    },

    async removeMoney(userId, guildId, amount, from = "system") {
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
            from: "money",
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
            type: "deposit",
            amount: finalAmount,
            from: "money",
            to: "bank",
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
            type: "withdraw",
            amount: finalAmount,
            from: "bank",
            to: "money",
        });

        return { success: true };
    },

    /* ========================================================================
       COOLDOWNS (daily, work, trash)
    ======================================================================== */

    async claimDaily(userId, guildId) {
        const user = await this.getUser(userId, guildId);
        if (!user) return null;

        user.daily_claim_at = Date.now();
        await user.save();

        return user.daily_claim_at;
    },

    async getWorkCooldown(userId, guildId) {
        const user = await this.getUser(userId, guildId);
        return user ? Number(user.work_cooldown) : 0;
    },

    async setWorkCooldown(userId, guildId, timestamp) {
        const user = await this.getUser(userId, guildId);
        if (!user) return null;

        user.work_cooldown = Number(timestamp);
        await user.save();
        return user.work_cooldown;
    },

    async getTrashCooldown(userId, guildId) {
        const user = await this.getUser(userId, guildId);
        return user ? Number(user.trash_cooldown) : 0;
    },

    async setTrashCooldown(userId, guildId, timestamp) {
        const user = await this.getUser(userId, guildId);
        if (!user) return null;

        user.trash_cooldown = Number(timestamp);
        await user.save();
        return user.trash_cooldown;
    },

    /* ========================================================================
       ITEMS — SISTEMA COMPLETO (NUEVO SISTEMA AVANZADO)
    ======================================================================== */

    async getItemByName(guildId, name) {
        if (!name) return null;

        return await Item.findOne({
            guildId,
            itemName: { $regex: `^${name}$`, $options: "i" },
        });
    },

    /* ------------------------------------------------------------------------
       🔥 NUEVA FUNCIÓN createItem REPARADA  
       Acepta config avanzada: inventory, usable, sellable, stock, requisitos…
    ------------------------------------------------------------------------- */
    async createItem(guildId, name, price, description, emoji, config = {}) {
        const exists = await Item.findOne({
            guildId,
            itemName: { $regex: `^${name}$`, $options: "i" },
        });

        if (exists) return null;

        const item = new Item({
            guildId,
            itemName: name,

            // Campos básicos
            price: Number(price) || 0,
            description: description || "",
            emoji: emoji || "📦",

            // --- Muy importante ---
            // YA NO se intenta guardar un objeto en "type".
            type: "misc",

            // Campos avanzados
            inventory: config.inventory ?? true,
            usable: config.usable ?? false,
            sellable: config.sellable ?? true,

            stock: config.stock ?? -1,
            timeLimit: config.timeLimit ?? 0,

            requirements: Array.isArray(config.requirements)
                ? config.requirements
                : [],

            actions: Array.isArray(config.actions)
                ? config.actions
                : [],

            data: config.data || {}
        });

        await item.save();
        return item;
    },

    async deleteItem(guildId, name) {
        const item = await this.getItemByName(guildId, name);
        if (!item) return false;

        await Inventory.deleteMany({ itemId: item._id });
        await item.deleteOne();

        return true;
    },

    /* ========================================================================
       INVENTARIO
    ======================================================================== */

    async getUserInventory(userId, guildId) {
        const data = await Inventory.find({ userId, guildId }).populate("itemId");

        return data.map(entry => ({
            itemName: entry.itemId.itemName,
            description: entry.itemId.description,
            emoji: entry.itemId.emoji,
            amount: entry.amount,
        }));
    },

    async addToInventory(userId, guildId, itemName, amount = 1) {
        const item = await this.getItemByName(guildId, itemName);
        if (!item) return null;

        const slot = await Inventory.findOne({
            userId, guildId, itemId: item._id
        });

        if (!slot) {
            return await Inventory.create({
                userId,
                guildId,
                itemId: item._id,
                amount,
            });
        }

        slot.amount += amount;
        await slot.save();
        return slot;
    },

    async removeItem(userId, guildId, itemName, amount = 1) {
        const item = await this.getItemByName(guildId, itemName);
        if (!item) return { success: false };

        const slot = await Inventory.findOne({
            userId, guildId, itemId: item._id
        });

        if (!slot || slot.amount < amount)
            return { success: false };

        slot.amount -= amount;

        if (slot.amount <= 0) await slot.deleteOne();
        else await slot.save();

        return { success: true };
    },

    /* ========================================================================
       TIENDA
    ======================================================================== */

    async getShop(guildId) {
        return await Item.find({ guildId }).sort({ price: 1 });
    }
};

// src/commands/economia/profile.js
const { SlashCommandBuilder } = require("discord.js");
const eco = require("@economy");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const safeReply = require("@src/utils/safeReply.js");
const ms = require("ms");
const Inventory = require("@database/mongodb.js").Inventory;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Muestra tu perfil económico.")
        .addUserOption(option =>
            option.setName("usuario")
                .setDescription("Ver el perfil de otro usuario")
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getUser("usuario") || interaction.user;
        const userId = target.id;
        const guildId = interaction.guild.id;

        // Obtener datos económicos
        const balance = await eco.getBalance(userId, guildId);
        const now = Date.now();

        // Cooldowns formateados
        const workCd = balance.workCooldown > now
            ? ms(balance.workCooldown - now, { long: true })
            : "Disponible";

        const dailyCd = balance.dailyClaim + eco.DAILY_COOLDOWN > now
            ? ms(balance.dailyClaim + eco.DAILY_COOLDOWN - now, { long: true })
            : "Disponible";

        // Inventario
        const inventoryItems = await Inventory.find({ userId, guildId, amount: { $gt: 0 } });
        const itemCount = inventoryItems.reduce((sum, i) => sum + i.amount, 0);

        // Total
        const total = balance.balance + balance.bank;

        // Embed
        const embed = new ThemedEmbed(interaction)
            .setTitle(`👤 Perfil de ${target.username}`)
            .setColor("#3498db")
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: "💰 Economía",
                    value:
                        `**Cartera:** $${balance.balance.toLocaleString()}\n` +
                        `**Banco:** $${balance.bank.toLocaleString()}\n` +
                        `**Total:** $${total.toLocaleString()}`,
                    inline: false
                },
                {
                    name: "⏳ Cooldowns",
                    value:
                        `**Work:** ${workCd}\n` +
                        `**Daily:** ${dailyCd}`,
                    inline: false
                },
                {
                    name: "📦 Inventario",
                    value: `Ítems totales: **${itemCount}**`,
                    inline: false
                }
            );

        return safeReply(interaction, { embeds: [embed] });
    }
};

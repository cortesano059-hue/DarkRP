// src/commands/economia/items/inventario.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventario')
        .setDescription('Muestra tu inventario'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            const items = await eco.getUserInventory(userId, guildId);

            if (!items || items.length === 0)
                return await safeReply(interaction, "📦 Tu inventario está vacío.");

            const embed = new EmbedBuilder()
                .setTitle("📦 Tu Inventario")
                .setColor("#3498DB");

            for (const item of items) {
                embed.addFields({
                    name: item.name,
                    value: `Cantidad: **${item.amount}**\n${item.description || "Sin descripción"}`,
                    inline: true
                });
            }

            await safeReply(interaction, { embeds: [embed] });

        } catch (err) {
            console.error("❌ Error en inventario:", err);
            await safeReply(interaction, "❌ Error al mostrar tu inventario.");
        }
    }
};

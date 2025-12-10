// src/commands/economia/items/inventario.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventario')
        .setDescription('Muestra tu inventario o el de otro usuario.')
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario del que ver el inventario")
        ),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const targetUser =
                interaction.options.getUser("usuario") || interaction.user;

            const guildId = interaction.guild.id;

            // Obtener inventario del usuario objetivo
            const items = await eco.getUserInventory(targetUser.id, guildId);

            if (!items || items.length === 0)
                return await safeReply(
                    interaction,
                    `📦 El inventario de **${targetUser.username}** está vacío.`
                );

            const embed = new EmbedBuilder()
                .setTitle(`📦 Inventario de ${targetUser.username}`)
                .setColor("#3498DB");

            for (const item of items) {
                embed.addFields({
                    name: `${item.emoji} ${item.itemName}`,
                    value: `Cantidad: **${item.amount}**\n${item.description || "Sin descripción"}`,
                    inline: true
                });
            }

            return await safeReply(interaction, { embeds: [embed] });

        } catch (err) {
            console.error("❌ Error en inventario:", err);
            return await safeReply(interaction, "❌ Error al mostrar el inventario.");
        }
    }
};

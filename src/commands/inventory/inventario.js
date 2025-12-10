// src/commands/economia/items/inventario.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("inventario")
        .setDescription("Muestra tu inventario o el de otro usuario.")
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

            // Ordenar por nombre (más limpio visualmente)
            items.sort((a, b) => a.itemName.localeCompare(b.itemName));

            const embed = new EmbedBuilder()
                .setTitle(`📦 Inventario de ${targetUser.username}`)
                .setColor("#3498DB")
                .setFooter({ text: `Total items distintos: ${items.length}` });

            for (const item of items) {
                embed.addFields({
                    name: `${item.emoji} ${item.itemName} × ${item.amount}`,
                    value:
                        `📝 ${item.description || "Sin descripción"}\n` +
                        `💰 Precio: **${item.price}** | 📦 Tipo: **${item.type}**\n` +
                        `🧪 Usable: **${item.usable ? "Sí" : "No"}** | 💸 Vendible: **${item.sellable ? "Sí" : "No"}**\n` +
                        `📥 Inventariable: **${item.inventory ? "Sí" : "No"}**`,
                    inline: false
                });
            }

            return await safeReply(interaction, { embeds: [embed] });

        } catch (err) {
            console.error("❌ Error en inventario:", err);
            return await safeReply(interaction, "❌ Error al mostrar el inventario.");
        }
    }
};

// src/commands/economia/items/iteminfo.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const safeReply = require("@safeReply");
const Item = require("@database/mongodb");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iteminfo')
        .setDescription('Muestra información de un item')
        .addStringOption(o =>
            o.setName('nombre').setDescription('Nombre del item').setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const query = interaction.options.getString("nombre");

            const item = await Item.findOne({
                itemName: new RegExp(query, "i"),
                guildId: interaction.guild.id
            });

            if (!item)
                return safeReply(interaction, "❌ Item no encontrado.");

            const embed = new EmbedBuilder()
                .setTitle(`📦 ${item.itemName}`)
                .addFields(
                    { name: "Descripción", value: item.description || "Sin descripción" },
                    { name: "Precio", value: `$${item.price}` }
                )
                .setColor("Blue");

            await safeReply(interaction, { embeds: [embed] });

        } catch (err) {
            console.error("❌ Error iteminfo:", err);
            await safeReply(interaction, "❌ Error al obtener información del item.");
        }
    }
};

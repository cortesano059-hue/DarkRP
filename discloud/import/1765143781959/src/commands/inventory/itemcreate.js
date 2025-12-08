// src/commands/economia/items/itemcreate.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('itemcreate')
        .setDescription('Crea un nuevo item en la tienda')
        .addStringOption(o =>
            o.setName('name').setDescription('Nombre del item').setRequired(true)
        )
        .addNumberOption(o =>
            o.setName('price').setDescription('Precio del item').setRequired(true)
        )
        .addStringOption(o =>
            o.setName('description').setDescription('Descripción del item')
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const name = interaction.options.getString("name");
        const price = interaction.options.getNumber("price");
        const description = interaction.options.getString("description") || "Sin descripción";

        if (price <= 0)
            return safeReply(interaction, "❌ El precio debe ser mayor que 0.");

        try {
            await eco.createItem(interaction.guild.id, name, {
                description,
                price
            });

            const embed = new EmbedBuilder()
                .setTitle("🛠️ Item Creado")
                .setDescription(`Se creó **${name}** por **$${price}**.`)
                .setColor("Green");

            await safeReply(interaction, { embeds: [embed] });

        } catch (err) {
            console.error("❌ Error itemcreate:", err);
            await safeReply(interaction, "❌ Error al crear el item.");
        }
    }
};

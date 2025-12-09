// src/commands/economia/items/itemedit.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const safeReply = require("@safeReply");
const { Item } = require("@src/database/mongodb.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('itemedit')
        .setDescription('Edita un item de la tienda')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(o =>
            o.setName('nombre').setDescription('Item a editar').setRequired(true)
        )
        .addNumberOption(o =>
            o.setName('precio').setDescription('Nuevo precio')
        )
        .addStringOption(o =>
            o.setName('descripcion').setDescription('Nueva descripción')
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const name = interaction.options.getString("nombre");
        const newPrice = interaction.options.getNumber("precio");
        const newDesc = interaction.options.getString("descripcion");

        if (!newPrice && !newDesc)
            return safeReply(interaction, "❌ Debes editar al menos un campo.");

        try {
            const item = await Item.findOne({
                itemName: new RegExp(`^${name}$`, "i"),
                guildId: interaction.guild.id
            });

            if (!item)
                return safeReply(interaction, "❌ Item no encontrado.");

            if (newPrice) item.price = newPrice;
            if (newDesc) item.description = newDesc;

            await item.save();

            const embed = new EmbedBuilder()
                .setTitle("🛠️ Item Actualizado")
                .addFields(
                    { name: "Nuevo Precio", value: `$${item.price}` },
                    { name: "Nueva Descripción", value: item.description }
                )
                .setColor("Yellow");

            await safeReply(interaction, { embeds: [embed] });

        } catch (err) {
            console.error("❌ Error itemedit:", err);
            await safeReply(interaction, "❌ Error al editar el item.");
        }
    }
};

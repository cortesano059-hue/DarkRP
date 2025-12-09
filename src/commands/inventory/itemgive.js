// src/commands/economia/items/giveitem.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const eco = require('@economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveitem')
        .setDescription('Da un item a un usuario')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(o => o.setName('usuario').setDescription('Usuario receptor').setRequired(true))
        .addStringOption(o => o.setName('item').setDescription('Nombre del item').setRequired(true))
        .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a dar')),

    async execute(interaction) {
        await interaction.deferReply();

        const user = interaction.options.getUser('usuario');
        const itemName = interaction.options.getString('item');
        let quantity = interaction.options.getInteger('cantidad') || 1;

        try {
            const item = await eco.getItemByName(interaction.guild.id, itemName);
            if (!item)
                return safeReply(interaction, `❌ Item "${itemName}" no encontrado.`);

            await eco.addToInventory(user.id, interaction.guild.id, item._id, quantity);

            const embed = new EmbedBuilder()
                .setTitle('🎁 Item Entregado')
                .setDescription(`Has dado **${quantity}x ${item.itemName}** a **${user.username}**.`)
                .setColor('#2ecc71');

            return safeReply(interaction, { embeds: [embed] });

        } catch (err) {
            console.error("❌ ERROR giveitem:", err);
            return safeReply(interaction, "❌ Error al dar el item.");
        }
    }
};

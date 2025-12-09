// src/commands/economia/items/itemdelete.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const { Item } = require("@src/database/mongodb.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('itemdelete')
        .setDescription('Eliminar un item de la tienda de forma permanente.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('nombre')
                .setDescription('Nombre del item a eliminar')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ });

        const nombreItem = interaction.options.getString('nombre');

        try {
            const deletedItem = await Item.findOneAndDelete({ 
                itemName: { $regex: new RegExp(`^${nombreItem}$`, 'i') },
                guildId: interaction.guild.id
            });

            if (!deletedItem) {
                return await safeReply(interaction, { 
                    content: `❌ No encontré ningún item llamado **"${nombreItem}"** en la tienda.` 
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Item Eliminado')
                .setDescription(`El item **${deletedItem.itemName}** fue eliminado correctamente.`)
                .setColor('#e74c3c')
                .setFooter({ text: `ID: ${deletedItem._id}` })
                .setTimestamp();

            await safeReply(interaction, { embeds: [embed] });

        } catch (err) {
            console.error('❌ ERROR EN itemdelete:', err);
            await safeReply(interaction, { content: '❌ Error al intentar eliminar el item.' });
        }
    }
};

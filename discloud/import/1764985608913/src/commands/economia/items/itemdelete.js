const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const Item = require("@src/models/Item.js"); // Importamos el modelo

module.exports = {
    data: new SlashCommandBuilder()
        .setName('itemdelete')
        .setDescription('Eliminar un item de la tienda de forma permanente.')
        .addStringOption(option => 
            option.setName('nombre')
                .setDescription('Nombre del item a eliminar')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ });

        const nombreItem = interaction.options.getString('nombre');

        try {
            // Buscamos y borramos (Case insensitive)
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
                .setDescription(`El item **${deletedItem.itemName}** ha sido eliminado de la tienda correctamente.`)
                .setColor('#e74c3c')
                .setFooter({ text: `ID: ${deletedItem._id}` })
                .setTimestamp();

            await safeReply(interaction, { embeds: [embed] });

        } catch (err) {
            console.error('❌ ERROR EN COMANDO itemdelete.js:', err);
            await safeReply(interaction, { content: '❌ Ocurrió un error al intentar eliminar el item.' });
        }
    }
};
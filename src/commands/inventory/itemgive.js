const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
try {
    const safeReply = require("@src/utils/safeReply.js");
    const eco = require('@economy'); // Usamos el helper de economía

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('giveitem')
            .setDescription('Da un item a un usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario receptor').setRequired(true))
            .addStringOption(o => o.setName('item').setDescription('Nombre del item').setRequired(true))
            .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a dar').setRequired(false)),

        async execute(interaction) {
            await interaction.deferReply({ });
            try {
                const user = interaction.options.getUser('usuario');
                const itemName = interaction.options.getString('item');
                let quantity = interaction.options.getInteger('cantidad') || 1;

                if (quantity <= 0) quantity = 1;

                // 1. Buscar item usando nuestra función de economy.js
                const item = await eco.getItemByName(interaction.guild.id, itemName);
                
                if (!item) {
                    return await safeReply(interaction, { content: `❌ Item "${itemName}" no encontrado en la tienda.` });
                }

                // 2. Dar item al inventario
                await eco.addToInventory(user.id, interaction.guild.id, item._id, quantity);

                const embed = new EmbedBuilder()
                    .setTitle('🎁 Item Entregado')
                    .setDescription(`Has dado a **${user.username}** **${quantity}x ${item.itemName}**.`)
                    .setColor('#2ecc71')
                    // Si tienes campo de imagen en 'data', úsalo, si no, null
                    .setThumbnail(item.data?.image || null) 
                    .setFooter({ text: `ID del Item: ${item._id}` });

                return await safeReply(interaction, { embeds: [embed] });

            } catch (err) {
                console.error('❌ ERROR EN COMANDO giveitem.js:', err);
                return await safeReply(interaction, { content: '❌ Ocurrió un error al dar el item.' });
            }
        }
    };

} catch(e) {
    console.error('❌ ERROR EN COMANDO giveitem.js:', e);
}
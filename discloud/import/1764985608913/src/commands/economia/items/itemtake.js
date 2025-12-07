const { SlashCommandBuilder } = require('discord.js');
try {
    const safeReply = require("@src/utils/safeReply.js");
    const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
    const eco = require('@economy');

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('takeitem')
            .setDescription('Quita un item de un usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario objetivo').setRequired(true))
            .addStringOption(o => o.setName('item').setDescription('Nombre del item a quitar').setRequired(true))
            .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a quitar').setRequired(true)),

        async execute(interaction) {
            await interaction.deferReply({ });

            const targetUser = interaction.options.getUser('usuario');
            const itemName = interaction.options.getString('item');
            const amount = interaction.options.getInteger('cantidad');

            if (!targetUser) return safeReply(interaction, ThemedEmbed.error('Error', 'Usuario no encontrado.'));
            if (amount <= 0) return safeReply(interaction, ThemedEmbed.error('Error', 'Cantidad inválida.'));

            try {
                const items = await eco.getUserInventory(targetUser.id, interaction.guild.id);
                const item = items.find(i => i.name.toLowerCase() === itemName.toLowerCase());

                if (!item) return safeReply(interaction, ThemedEmbed.error('Error', `${targetUser.username} no tiene el item "${itemName}".`));
                if (item.amount < amount) return safeReply(interaction, ThemedEmbed.error('Error', `${targetUser.username} solo tiene ${item.amount} de "${itemName}".`));

                // Quitar el item
                await eco.removeItem(targetUser.id, interaction.guild.id, itemName, amount);

                const embed = new ThemedEmbed(interaction)
                    .setTitle('🛠 Item Retirado')
                    .setDescription(`Se han quitado **${amount}x ${itemName}** de ${targetUser.username}.`)
                    .setColor('#e74c3c');

                return safeReply(interaction, { embeds: [embed] });

            } catch (err) {
                console.error('❌ ERROR EN COMANDO takeitem.js:', err);
                return safeReply(interaction, ThemedEmbed.error('Error', 'No se pudo quitar el item.'));
            }
        }
    };
} catch (e) {
    console.error('❌ ERROR EN COMANDO takeitem.js:', e);
}

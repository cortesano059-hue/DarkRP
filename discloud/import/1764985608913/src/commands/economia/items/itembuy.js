const { SlashCommandBuilder } = require('discord.js');
try {
    const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
    const eco = require('@economy');
    const safeReply = require("@src/utils/safeReply.js");

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('itembuy')
            .setDescription('Comprar un item del shop por nombre.')
            .addStringOption(o => o.setName('nombre').setDescription('Nombre del item').setRequired(true)),

        async execute(interaction) {
            await interaction.deferReply({ });

            try {
                const user = interaction.user;
                const itemName = interaction.options.getString('nombre');

                if (!itemName) return safeReply(interaction, ThemedEmbed.error('Error', 'Nombre inválido.'));

                // Comprar item
                const result = await eco.buyItemByName(user.id, interaction.guild.id, itemName);
                if (!result.success) return safeReply(interaction, ThemedEmbed.error('Error', result.message));

                const item = result.item;

                // Obtener balance actualizado
                const balance = await eco.getBalance(user.id, interaction.guild.id);

                const embed = new ThemedEmbed(interaction)
                    .setTitle('🛒 Compra Exitosa')
                    .setColor('#3498DB')
                    .setDescription(`Has comprado un item del shop.`)
                    .addFields(
                        { name: 'Usuario', value: `${user.tag}`, inline: true },
                        { name: 'Item', value: `${item.name}`, inline: true },
                        { name: 'Precio', value: `$${item.price}`, inline: true },
                        { name: 'Descripción', value: `${item.description || 'Sin descripción'}`, inline: false },
                        { name: 'Dinero en Mano', value: `$${balance.balance}`, inline: true },
                        { name: 'Dinero en Banco', value: `$${balance.bank}`, inline: true }
                    );

                return await safeReply(interaction, { embeds: [embed] });

            } catch (err) {
                console.error('❌ ERROR EN COMANDO buyitem.js:', err);
                return safeReply(interaction, ThemedEmbed.error('Error', 'No se pudo procesar la compra.'));
            }
        }
    };
} catch (e) {
    console.error('❌ ERROR EN COMANDO buyitem.js:', e);
}

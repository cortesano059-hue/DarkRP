const { SlashCommandBuilder } = require('discord.js');

try {
    const eco = require('@economy');
    const safeReply = require("@src/utils/safeReply.js");
    const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('balance')
            .setDescription('Ver tu dinero o el de otro usuario')
            .addUserOption(o => o
                .setName('usuario')
                .setDescription('Usuario a consultar')
                .setRequired(false)
            ),

        async execute(interaction) {
            // Defer reply usando flags actualizados
            await interaction.deferReply({ ephemeral: false});

            const user = interaction.options.getUser('usuario') || interaction.user;
            const guildId = interaction.guild.id;

            try {
                const balance = await eco.getBalance(user.id, guildId);

                const embed = new ThemedEmbed(interaction)
                    .setTitle(`💰 Balance de ${user.tag}`)
                    .setColor('#f1c40f')
                    .addFields(
                        { name: 'Dinero en Mano', value: `$${balance.balance}`, inline: true },
                        { name: 'Dinero en Banco', value: `$${balance.bank}`, inline: true }
                    );

                return await interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error('❌ ERROR EN COMANDO balance.js:', err);

                const errorEmbed = ThemedEmbed.error('Error', 'No se pudo obtener el balance.');
                return await interaction.editReply({ embeds: [errorEmbed] });
            }
        }
    };

} catch (e) {
    console.error('❌ ERROR EN COMANDO balance.js:', e);
}

const { SlashCommandBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('desescoltar')
        .setDescription('Soltar ciudadano.')
        .addUserOption(option =>
            option.setName('usuario')
                  .setDescription('Usuario que será desescoltado')
                  .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ });

        try {
            const target = interaction.options.getMember('usuario');
            if (!target) {
                return await safeReply(interaction, { content: '❌ Debes mencionar a un usuario válido.' });
            }

            const embed = new ThemedEmbed(interaction)
                .setTitle('👮 Procedimiento Policial')
                .setDescription(`**${interaction.user.username}** ha terminado de escoltar a **${target.username}**.`)
                .setColor('#2c3e50');

            await safeReply(interaction, { embeds: [embed] });
        } catch (err) {
            console.error('❌ Error en desescoltar.js:', err);
            await safeReply(interaction, { content: '❌ Ocurrió un error al ejecutar el comando.' });
        }
    }
};

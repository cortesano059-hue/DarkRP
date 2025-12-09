const { SlashCommandBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('desesposar')
        .setDescription('Quitar esposas.')
        .addUserOption(o => o.setName('usuario').setDescription('Objetivo').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ });

        try {
            const target = interaction.options.getMember('usuario');

            const embed = new ThemedEmbed(interaction)
                .setTitle('👮 Procedimiento Policial')
                .setDescription(`**${interaction.user.username}** ha quitado las esposas a **${target.username}**.`)
                .setColor('#2c3e50');

            await safeReply(interaction, { embeds: [embed] });
        } catch (err) {
            console.error('❌ Error en desesposar.js:', err);
            await safeReply(interaction, { content: '❌ Ocurrió un error al ejecutar el comando.' });
        }
    }
};

const { SlashCommandBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('entorno')
        .setDescription('Envía un mensaje de entorno global.')
        .addStringOption(o => o
            .setName('mensaje')
            .setDescription('Lo que sucede')
            .setRequired(true))
        .addStringOption(o => o
            .setName('ubicacion')
            .setDescription('Ubicación del evento')
            .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ });

        try {
            const text = interaction.options.getString('mensaje');
            const ubicacion = interaction.options.getString('ubicacion') || 'Desconocida';

            const embed = new ThemedEmbed(interaction)
                .setTitle('📢 LLAMADA DE ENTORNO')
                .setColor('#F1C40F')
                .setDescription(text)
                .addFields({ name: '📍 Ubicación', value: ubicacion, inline: true });

            await safeReply(interaction, { embeds: [embed] });
        } catch (err) {
            console.error('❌ Error en entorno.js:', err);
            await safeReply(interaction, { content: '❌ Ocurrió un error al enviar el mensaje de entorno.' });
        }
    }
};

const { SlashCommandBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const DutyStatus = require("@src/models/DutyStatus.js"); // ✅ Modelo DutyStatus

module.exports = {
    data: new SlashCommandBuilder()
        .setName('offduty')
        .setDescription('Salir de servicio y mostrar tiempo.'),

    async execute(interaction) {
        await interaction.deferReply({ });

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            // ✅ MongoDB: Buscar y eliminar
            const status = await DutyStatus.findOneAndDelete({ userId, guildId });

            if (!status) {
                return await safeReply(interaction, { content: '❌ No estabas en servicio.' });
            }

            const startTime = new Date(status.startTime);
            const endTime = new Date();
            const diffMs = endTime - startTime; // diferencia en milisegundos

            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

            const embed = new ThemedEmbed(interaction)
                .setTitle('🛡️ Fuera de Servicio')
                .setDescription(`**${interaction.user.username}** ha terminado su turno.\nTiempo total: **${hours}h ${minutes}m ${seconds}s**`)
                .setColor('Grey');

            await safeReply(interaction, { embeds: [embed] });
        } catch (err) {
            console.error('❌ Error en offduty.js:', err);
            await safeReply(interaction, { content: '❌ Ocurrió un error al salir de servicio.' });
        }
    }
};
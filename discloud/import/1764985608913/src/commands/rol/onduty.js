const { SlashCommandBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const DutyStatus = require("@src/models/DutyStatus.js"); // ✅ Modelo DutyStatus

module.exports = {
    data: new SlashCommandBuilder()
        .setName('onduty')
        .setDescription('Entrar en servicio.'),

    async execute(interaction) {
        await interaction.deferReply({ });

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            // ✅ MongoDB: FindOneAndUpdate con upsert (crear si no existe)
            await DutyStatus.findOneAndUpdate(
                { userId, guildId },
                { 
                    userId, 
                    guildId, 
                    startTime: new Date() // Guardamos la fecha actual
                },
                { upsert: true, new: true }
            );

            const embed = new ThemedEmbed(interaction)
                .setTitle('🛡️ En Servicio')
                .setDescription(`**${interaction.user.username}** está ahora EN SERVICIO.`)
                .setColor('Green');

            await safeReply(interaction, { embeds: [embed] });
        } catch (err) {
            console.error('❌ Error en onduty.js:', err);
            await safeReply(interaction, { content: '❌ Ocurrió un error al activar el servicio.' });
        }
    }
};
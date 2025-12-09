// src/commands/developer/synccommands.js
const { SlashCommandBuilder, REST, Routes, EmbedBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply.js");
require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("synccommands")
        .setDescription("Sincroniza los comandos del bot (Owner Only)."),

    async execute(interaction) {

        // OWNER CHECK
        if (interaction.user.id !== process.env.OWNER_ID) {
            return safeReply(interaction, "❌ Solo el owner del bot puede usar este comando.");
        }

        await interaction.deferReply({ ephemeral: true });

        const client = interaction.client;
        const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

        try {
            // Registrar comandos globales
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: client.commandsArray }
            );

            return safeReply(interaction, {
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🔄 Comandos sincronizados")
                        .setDescription("Todos los comandos globales han sido actualizados.")
                        .setColor("Green")
                ]
            });

        } catch (err) {
            console.error("❌ Error en synccommands:", err);
            return safeReply(interaction, "❌ Error al sincronizar comandos.");
        }
    }
};

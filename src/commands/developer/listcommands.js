const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const safeReply = require("@src/utils/safeReply.js");
const { REST, Routes } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("listcommands")
        .setDescription("Muestra todos los comandos registrados (globales y de servidor).")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
        const appId = process.env.CLIENT_ID;
        const guildId = interaction.guild.id;

        try {
            // --- Pedimos ambos tipos de comandos ---
            let global = await rest.get(Routes.applicationCommands(appId)) || [];
            let guild = await rest.get(Routes.applicationGuildCommands(appId, guildId)) || [];

            // Discord a veces devuelve objetos vacíos → lo forzamos a array
            if (!Array.isArray(global)) global = [];
            if (!Array.isArray(guild)) guild = [];

            // Formatear texto
            const globalList = global.length
                ? global.map(c => `🌍 **${c.name}** — ID: \`${c.id}\``).join("\n")
                : "❌ No hay comandos globales.";

            const guildList = guild.length
                ? guild.map(c => `🏠 **${c.name}** — ID: \`${c.id}\``).join("\n")
                : "❌ No hay comandos del servidor.";

            return safeReply(interaction, {
                embeds: [
                    {
                        title: "📋 Lista de comandos registrados",
                        color: 0x00aaff,
                        fields: [
                            { name: "🌍 Comandos Globales", value: globalList },
                            { name: "🏠 Comandos del Servidor", value: guildList }
                        ],
                        timestamp: new Date()
                    }
                ]
            });

        } catch (error) {
            console.error("❌ Error en /listcommands:", error);
            return safeReply(interaction, "❌ Error al obtener los comandos.");
        }
    }
};

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { IncomeRole } = require("@src/database/mongodb.js");
const safeReply = require("@src/utils/safeReply.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("incomeinfo")
        .setDescription("Muestra todos los roles que tienen un sueldo asignado."),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const roles = await IncomeRole.find({ guildId });

        if (roles.length === 0) {
            return safeReply(interaction, "⚠️ No hay roles con sueldo configurado.");
        }

        const embed = new EmbedBuilder()
            .setTitle("💼 Sueldos configurados")
            .setColor("#2ecc71")
            .setDescription(
                roles
                    .map(r => {
                        const role = interaction.guild.roles.cache.get(r.roleId);
                        return `• ${role ? role : "Rol eliminado"} — **$${r.incomePerHour}/h**`;
                    })
                    .join("\n")
            );

        safeReply(interaction, { embeds: [embed] });
    }
};

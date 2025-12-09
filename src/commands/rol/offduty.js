// src/commands/rol/offduty.js
const { SlashCommandBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const logger = require("@src/utils/logger.js");

const { DutyStatus, IncomeRole, User } = require("@src/database/mongodb.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("offduty")
        .setDescription("Sal del servicio y recibe tu paga correspondiente."),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        await interaction.deferReply({ ephemeral: false });

        const duty = await DutyStatus.findOne({ userId, guildId });

        if (!duty) {
            return safeReply(interaction, {
                embeds: [
                    new ThemedEmbed(interaction)
                        .setTitle("⚠️ No estabas en servicio")
                        .setColor("#e67e22")
                ]
            });
        }

        const now = Date.now();
        const start = duty.startTime.getTime();
        const diffMs = now - start;

        if (diffMs < 10 * 60 * 1000) {
            return safeReply(interaction, {
                content: "❌ Debes haber trabajado al menos **10 minutos** para recibir salario."
            });
        }

        const diffHours = diffMs / (1000 * 60 * 60);

        const roleIncome = await IncomeRole.findOne({
            guildId,
            roleId: duty.roleId
        });

        if (!roleIncome) {
            return safeReply(interaction, {
                content: "⚠️ Error: el rol ya no tiene salario configurado."
            });
        }

        const hourlyPay = roleIncome.incomePerHour;
        const amountEarned = Math.floor(diffHours * hourlyPay);

        // Ingresar al banco
        const user = await User.findOneAndUpdate(
            { userId, guildId },
            { $inc: { bank: amountEarned } },
            { new: true }
        );

        // Borrar estado de servicio
        await DutyStatus.deleteOne({ userId, guildId });

        const minutes = Math.floor(diffMs / 60000);
        const hours = (minutes / 60).toFixed(2);

        const embed = new ThemedEmbed(interaction)
            .setTitle("🔴 Servicio finalizado")
            .setDescription(
                `Has salido del servicio como <@&${roleIncome.roleId}>.\n\n` +
                `**Tiempo trabajado:** ${minutes} minutos (${hours}h)\n` +
                `**Salario recibido:** $${amountEarned}\n` +
                `**Balance actual en banco:** $${user.bank}`
            )
            .setColor("#e74c3c");

        await safeReply(interaction, { embeds: [embed] });

        logger.info(
            `${interaction.user.tag} salió del servicio y ganó $${amountEarned}`,
            "Duty"
        );
    }
};

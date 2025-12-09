const { SlashCommandBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const { DutyStatus, User, IncomeRole } = require("@src/database/mongodb.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("offduty")
        .setDescription("Salir del servicio y recibir el salario acumulado (se envía al banco)."),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const user = interaction.user;

        // Buscar estado en servicio
        const duty = await DutyStatus.findOne({ userId: user.id, guildId });

        if (!duty) {
            return safeReply(interaction, "❌ No estás en servicio.");
        }

        // Buscar sueldo asociado
        const income = await IncomeRole.findOne({
            guildId,
            roleId: duty.roleId
        });

        if (!income) {
            await duty.deleteOne();
            return safeReply(interaction, "⚠️ Tu rol ya no tiene sueldo configurado.");
        }

        const now = Date.now();
        const minutesWorked = Math.floor((now - duty.startTime) / 60000);

        // Pago proporcional (sueldoPorHora / 60 * minutosTrabajados)
        const earned = Math.floor((income.incomePerHour / 60) * minutesWorked);

        // Actualizamos SALDO EN BANCO directamente
        const updated = await User.findOneAndUpdate(
            { userId: user.id, guildId },
            { $inc: { bank: earned } },
            { new: true }
        );

        // Eliminar duty
        await duty.deleteOne();

        const embed = new ThemedEmbed(interaction)
            .setTitle("🔴 Fin del Servicio")
            .setDescription(
                `Tu servicio ha finalizado.\n\n` +
                `⏱ **Tiempo trabajado:** ${minutesWorked} min\n` +
                `💵 **Pago recibido:** $${earned}\n\n` +
                `**Balances actuales:**\n` +
                `🖐️ Dinero en mano: **$${updated.money}**\n` +
                `🏦 Dinero en banco: **$${updated.bank}**`
            );

        return safeReply(interaction, { embeds: [embed] });
    }
};
    
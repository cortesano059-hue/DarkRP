const { SlashCommandBuilder } = require("discord.js");
const { DutyStatus, IncomeRole, User } = require("@src/database/mongodb.js");
const safeReply = require("@src/utils/safeReply.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("offduty")
    .setDescription("Salir de servicio y recibir el pago del tiempo trabajado."),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    const status = await DutyStatus.findOne({ userId, guildId });
    if (!status) return safeReply(interaction, "❌ No estabas en servicio.");

    const now = new Date();
    const msWorked = now - status.startTime;
    const minutes = Math.floor(msWorked / 60000);

    // Pago mínimo: 10 min
    if (minutes < 10) {
      await DutyStatus.deleteOne({ userId, guildId });
      return safeReply(interaction, "⏱️ Estuviste menos de 10 minutos. No recibes pago.");
    }

    const incomeRole = await IncomeRole.findOne({
      guildId,
      roleId: status.roleId,
    });

    if (!incomeRole) {
      await DutyStatus.deleteOne({ userId, guildId });
      return safeReply(interaction, "⚠️ Tu rol ya no tiene salario configurado.");
    }

    // Calculamos pago proporcional
    const perMinute = incomeRole.incomePerHour / 60;
    const payment = Math.round(perMinute * minutes);

    // Añadir al banco
    await User.findOneAndUpdate(
      { userId, guildId },
      { $inc: { bank: payment } },
      { upsert: true }
    );

    await DutyStatus.deleteOne({ userId, guildId });

    return safeReply(interaction, {
      embeds: [
        {
          title: "🔴 Fin de servicio",
          description: `Has trabajado **${minutes} minutos**.\n\nHas recibido **$${payment}** que fueron enviados a tu **banco**.`,
          color: 0xe74c3c,
        }
      ]
    });
  }
};

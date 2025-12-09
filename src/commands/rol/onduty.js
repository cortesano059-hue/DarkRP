const { SlashCommandBuilder } = require("discord.js");
const { IncomeRole, DutyStatus } = require("@src/database/mongodb.js");
const safeReply = require("@src/utils/safeReply.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("onduty")
    .setDescription("Entrar en servicio y comenzar a recibir salario."),

  async execute(interaction) {
    const user = interaction.user;
    const guild = interaction.guild;

    // ¿Ya está en servicio?
    const existing = await DutyStatus.findOne({
      userId: user.id,
      guildId: guild.id,
    });

    if (existing) {
      return safeReply(interaction, "⚠️ Ya estabas en servicio.");
    }

    // Obtener roles del usuario
    const member = await guild.members.fetch(user.id);
    const roles = member.roles.cache.map(r => r.id);

    // Buscar roles con salario
    const incomeRoles = await IncomeRole.find({ guildId: guild.id });

    const validRoles = incomeRoles
      .filter(r => roles.includes(r.roleId))
      .sort((a, b) => {
        // Ordena según jerarquía más alta del servidor
        const rankA = guild.roles.cache.get(a.roleId)?.position || 0;
        const rankB = guild.roles.cache.get(b.roleId)?.position || 0;
        return rankB - rankA;
      });

    if (validRoles.length === 0) {
      return safeReply(interaction, "❌ Tu usuario no tiene ningún rol con salario configurado.");
    }

    const selectedRole = validRoles[0];

    // Guardar estado
    await DutyStatus.create({
      userId: user.id,
      guildId: guild.id,
      roleId: selectedRole.roleId,
      startTime: new Date(),
      lastPayment: new Date(),
      channelId: interaction.channel.id,
    });

    return safeReply(interaction, {
      embeds: [
        {
          title: "🟢 En servicio",
          description: `Has entrado en servicio como **<@&${selectedRole.roleId}>**.\nComenzarás a recibir pagos automáticos.`,
          color: 0x2ecc71,
        }
      ]
    });
  }
};

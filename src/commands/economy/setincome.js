const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { IncomeRole } = require("@src/database/mongodb.js");
const safeReply = require("@src/utils/safeReply.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setincome")
    .setDescription("Configura el sueldo por hora de un rol.")
    .addRoleOption(o => 
        o.setName("rol")
        .setDescription("Rol al que asignar salario")
        .setRequired(true)
    )
    .addIntegerOption(o =>
        o.setName("cantidad")
        .setDescription("Cantidad por hora")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const role = interaction.options.getRole("rol");
    const amount = interaction.options.getInteger("cantidad");

    await IncomeRole.findOneAndUpdate(
      { guildId, roleId: role.id },
      { incomePerHour: amount },
      { upsert: true }
    );

    return safeReply(interaction, {
      content: `💼 El rol **${role.name}** ahora cobra **${amount}$/hora**.`,
    });
  }
};

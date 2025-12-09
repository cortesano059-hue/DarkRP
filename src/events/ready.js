const { Events } = require("discord.js");
const { DutyStatus, IncomeRole, User } = require("@src/database/mongodb.js");

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log(`🤖 Bot listo como ${client.user.tag}`);

    setInterval(async () => {
      const now = new Date();
      const active = await DutyStatus.find();

      for (const user of active) {
        const diff = now - user.lastPayment;
        if (diff < 3600000) continue; // 1h

        const incomeRole = await IncomeRole.findOne({
          guildId: user.guildId,
          roleId: user.roleId,
        });

        if (!incomeRole) continue;

        // Paga una hora completa
        const amount = incomeRole.incomePerHour;

        await User.findOneAndUpdate(
          { userId: user.userId, guildId: user.guildId },
          { $inc: { bank: amount } },
          { upsert: true }
        );

        // Actualizar última hora pagada
        user.lastPayment = now;
        await user.save();

        // Mandar mensaje
        const guild = client.guilds.cache.get(user.guildId);
        if (!guild) continue;

        const channel = guild.channels.cache.get(user.channelId);
        if (!channel) continue;

        channel.send({
          content: `<@${user.userId}>`,
          embeds: [
            {
              title: "💼 Pago por Servicio",
              description: `Has recibido **$${amount}** por 1 hora trabajada.\nEl pago ha sido enviado a tu **banco**.`,
              color: 0x3498db,
            },
          ],
        });
      }
    }, 60000); // cada 1 min
  }
};

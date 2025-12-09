// src/events/ready.js
const { Events, REST, Routes } = require("discord.js");
const logger = require("@src/utils/logger.js");
const { DutyStatus, IncomeRole, User } = require("@src/database/mongodb.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log(`🤖 Logged in as ${client.user.tag}`);
    logger.info(`Bot conectado como ${client.user.tag}`);

    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

    try {
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: client.commandsArray }
      );
      logger.info("✅ Comandos registrados correctamente.");
    } catch (err) {
      logger.error("Error al registrar comandos:", err);
    }

    /* ===============================================
       🔥 SISTEMA DE SUELDOS AUTOMÁTICOS — CADA 1 MIN
    ================================================ */
    setInterval(async () => {
      const now = Date.now();
      const activeUsers = await DutyStatus.find({});

      for (const duty of activeUsers) {
        const incomeRole = await IncomeRole.findOne({
          guildId: duty.guildId,
          roleId: duty.roleId,
        });

        if (!incomeRole) continue;
        
        const channel = client.channels.cache.get(duty.channelId);
        if (!channel) continue;

        const minutesWorked = (now - duty.startTime) / 60000;
        if (minutesWorked < 10) continue; // mínimo 10 minutos

        const minutesSincePayment =
          duty.lastPayment === 0
            ? minutesWorked
            : (now - duty.lastPayment) / 60000;

        if (minutesSincePayment < 1) continue;

        const hourly = incomeRole.incomePerHour;
        const toPay = Math.floor((hourly / 60) * minutesSincePayment);

        if (toPay <= 0) continue;

        await User.updateOne(
          { userId: duty.userId, guildId: duty.guildId },
          { $inc: { money: toPay } }
        );

        duty.lastPayment = now;
        await duty.save();

        const embed = new ThemedEmbed()
          .setTitle("💸 Pago por Servicio")
          .setDescription(
            `Has recibido **$${toPay}** por estar en servicio durante **${minutesSincePayment.toFixed(
              1
            )} minutos**.\n\n¡Sigue trabajando!`
          );

        channel.send({ content: `<@${duty.userId}>`, embeds: [embed] });
      }
    }, 60_000); // 1 minuto
  },
};

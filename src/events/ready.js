// src/events/ready.js
const { Events } = require("discord.js");
const logger = require("@src/utils/logger.js");
const { DutyStatus, IncomeRole, User } = require("@src/database/mongodb.js");
require("dotenv").config();

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    logger.info(`🤖 Bot conectado como ${client.user.tag}`);

    /* ======================================================
       REGISTRO DE COMANDOS
    ====================================================== */
    const rest = new (require("@discordjs/rest").REST)({ version: "10" })
      .setToken(process.env.DISCORD_TOKEN);

    try {
      await rest.put(
        require("discord.js").Routes.applicationGuildCommands(
          client.user.id,
          process.env.GUILD_ID
        ),
        { body: client.commandsArray }
      );

      logger.info(`✅ ${client.commandsArray.length} comandos registrados`);
    } catch (err) {
      logger.error("❌ Error registrando comandos:", err);
    }

    /* ======================================================
       SISTEMA DE PAGOS AUTOMÁTICOS CADA 1 MINUTO
    ====================================================== */
    setInterval(async () => {
      try {
        const now = Date.now();
        const allDutyUsers = await DutyStatus.find({});

        for (const duty of allDutyUsers) {
          const diffMs = now - duty.lastPayment.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          // ¿Ya pasó 1h desde el último pago?
          if (diffHours < 1) continue;

          // Buscar sueldo del rol
          const incomeRole = await IncomeRole.findOne({
            guildId: duty.guildId,
            roleId: duty.roleId,
          });

          if (!incomeRole || !incomeRole.incomePerHour) {
            logger.warn(
              `⚠ Usuario ${duty.userId} tenía duty pero sin income configurado`
            );
            await DutyStatus.deleteOne({ userId: duty.userId, guildId: duty.guildId });
            continue;
          }

          const salary = incomeRole.incomePerHour;

          // Actualizar banco
          await User.findOneAndUpdate(
            { userId: duty.userId, guildId: duty.guildId },
            { $inc: { bank: salary } },
            { upsert: true }
          );

          // Actualizar último pago
          duty.lastPayment = new Date();
          await duty.save();

          // Mandar mensaje al canal si existe
          const guild = client.guilds.cache.get(duty.guildId);
          const channel = guild?.channels?.cache.get(duty.channelId);

          if (channel) {
            channel.send({
              content: `<@${duty.userId}>`,
              embeds: [
                {
                  title: "💵 Pago por servicio (1h)",
                  description: `Has recibido **$${salary}** por tu última hora de servicio.`,
                  color: 0x2ecc71,
                  footer: {
                    text: "Sistema automático de salarios",
                  },
                },
              ],
            }).catch(() => {});
          }
        }
      } catch (err) {
        logger.error("❌ Error en el sistema de pagos automáticos:", err);
      }
    }, 60 * 1000); // Se ejecuta cada minuto

    logger.info("⏱ Sistema automático de salarios iniciado.");
  },
};

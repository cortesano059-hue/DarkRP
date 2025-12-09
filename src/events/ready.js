// src/events/ready.js
const { Events } = require("discord.js");
const logger = require("@src/utils/logger.js");
const { DutyStatus, IncomeRole, User } = require("@src/database/mongodb.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        console.log(`🤖 Logged in as ${client.user.tag}`);
        logger.info(`Bot conectado como ${client.user.tag}`);

        // ----------------------------------------
        // 🔄 CONTROL DE PAGO AUTOMÁTICO CADA 1 MINUTO
        // ----------------------------------------
        setInterval(async () => {
            try {
                const activeUsers = await DutyStatus.find();

                for (const duty of activeUsers) {
                    const { userId, guildId, roleId, startTime, channelId } = duty;

                    const guild = client.guilds.cache.get(guildId);
                    if (!guild) continue;

                    const member = guild.members.cache.get(userId);
                    if (!member) continue;

                    const income = await IncomeRole.findOne({ guildId, roleId });
                    if (!income) continue;

                    const now = Date.now();
                    const elapsed = now - startTime.getTime();

                    // ❌ Si no hay al menos 1 hora trabajada, no pagar aún
                    if (elapsed < 3600000) continue;

                    // ✔ Calcular horas completas
                    const hours = Math.floor(elapsed / 3600000);
                    const amount = hours * income.incomePerHour;

                    // ✔ Pagar al banco
                    const userDB = await User.findOneAndUpdate(
                        { userId, guildId },
                        { $inc: { bank: amount } },
                        { new: true }
                    );

                    // ✔ Reiniciar contador del servicio
                    duty.startTime = new Date(now);
                    await duty.save();

                    // ✔ Enviar embed al canal donde hizo /onduty
                    const channel = guild.channels.cache.get(channelId);
                    if (channel) {
                        const embed = new ThemedEmbed()
                            .setTitle("💼 Pago Automático por Servicio")
                            .setDescription(
                                `<@${userId}> has recibido **$${amount}** por **${hours} hora(s)** trabajadas.\n\n` +
                                `**Rol:** <@&${roleId}>\n` +
                                `**Balance Actual (Banco):** $${userDB.bank}`
                            )
                            .setColor("#2ecc71");

                        channel.send({ embeds: [embed] }).catch(() => {});
                    }

                    logger.info(
                        `PAGO HORARIO AUTO: ${member.user.tag} → $${amount} por ${hours}h`,
                        "Duty-AutoPay"
                    );
                }

            } catch (err) {
                logger.error("❌ Error en el sistema de auto-pago:", err);
            }
        }, 60 * 1000); // Revisa cada 1 minuto

        logger.info("⏱️ Sistema automático de pago por horas iniciado.");
    },
};

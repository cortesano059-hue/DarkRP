// src/commands/rol/onduty.js
const { SlashCommandBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const logger = require("@src/utils/logger.js");

const { DutyStatus, IncomeRole, User } = require("@src/database/mongodb.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("onduty")
        .setDescription("Ponte en servicio y empieza a generar ingresos."),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        await interaction.deferReply({ ephemeral: false });

        // Ver si ya está en servicio
        const existing = await DutyStatus.findOne({ userId, guildId });
        if (existing) {
            return safeReply(interaction, {
                embeds: [
                    new ThemedEmbed(interaction)
                        .setTitle("⚠️ Ya estás en servicio")
                        .setDescription("Debes usar `/offduty` antes de volver a entrar.")
                        .setColor("#f1c40f")
                ]
            });
        }

        // Obtener roles configurados
        const incomes = await IncomeRole.find({ guildId });

        if (!incomes.length) {
            return safeReply(interaction, {
                content: "⚠️ No hay roles de salario configurados. Usa `/setincome` primero."
            });
        }

        // Buscar roles que tenga el usuario y que tengan income configurado
        const member = await interaction.guild.members.fetch(userId);

        const validRoles = incomes.filter(inc => member.roles.cache.has(inc.roleId));

        if (!validRoles.length) {
            return safeReply(interaction, {
                content: "❌ No tienes ningún rol con salario configurado."
            });
        }

        // Escoger el rol con el mayor salario
        const selectedRole = validRoles.sort((a, b) => b.incomePerHour - a.incomePerHour)[0];

        // Guardar el estado DUTY
        await DutyStatus.create({
            userId,
            guildId,
            roleId: selectedRole.roleId,
            startTime: new Date()
        });

        const embed = new ThemedEmbed(interaction)
            .setTitle("🟢 Servicio iniciado")
            .setDescription(
                `Has entrado en servicio como <@&${selectedRole.roleId}>.\n\n` +
                `**Salario:** $${selectedRole.incomePerHour}/hora`
            )
            .setColor("#2ecc71");

        await safeReply(interaction, { embeds: [embed] });

        logger.info(`${interaction.user.tag} ha iniciado servicio.`, "Duty");

    }
};

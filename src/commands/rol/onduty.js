// src/commands/rol/onduty.js
const { SlashCommandBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const { DutyStatus, IncomeRole } = require("@src/database/mongodb.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("onduty")
        .setDescription("Entrar en servicio y comenzar a generar salario."),

    async execute(interaction) {
        const user = interaction.user;
        const member = await interaction.guild.members.fetch(user.id);
        const guildId = interaction.guild.id;
        const channelId = interaction.channel.id;

        if (await DutyStatus.findOne({ userId: user.id, guildId })) {
            return safeReply(interaction, "❌ Ya estás en servicio.");
        }

        const rolesWithIncome = await IncomeRole.find({ guildId });
        const valid = rolesWithIncome.filter(r => member.roles.cache.has(r.roleId));

        if (valid.length === 0) {
            return safeReply(interaction, "❌ No tienes roles con sueldo configurado.");
        }

        const selected = valid
            .map(r => ({
                roleId: r.roleId,
                incomePerHour: r.incomePerHour,
                position: member.guild.roles.cache.get(r.roleId).position
            }))
            .sort((a, b) => b.position - a.position)[0];

        await DutyStatus.create({
            userId: user.id,
            guildId,
            roleId: selected.roleId,
            incomePerHour: selected.incomePerHour,
            channelId,
            startTime: Date.now(),
            lastPayment: Date.now()
        });

        const embed = new ThemedEmbed(interaction)
            .setTitle("🟢 En Servicio")
            .setDescription(
                `Has entrado en servicio.\n` +
                `💼 Rol: <@&${selected.roleId}>\n` +
                `💸 Sueldo: **$${selected.incomePerHour}/h**\n\n` +
                `El pago se realizará automáticamente cada **1 hora**.\n` +
                `Si sales antes, recibirás el pago proporcional.`
            );

        safeReply(interaction, { embeds: [embed] });
    }
};

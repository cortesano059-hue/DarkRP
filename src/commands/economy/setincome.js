// src/commands/policia/setincome.js
const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const logger = require("@src/utils/logger.js");

const { IncomeRole } = require("@src/database/mongodb.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setincome")
        .setDescription("Configura cuánto cobra un rol por hora de servicio.")
        .addRoleOption(option =>
            option
                .setName("rol")
                .setDescription("Rol al que quieres asignar un salario por hora.")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("cantidad")
                .setDescription("Cantidad que cobrará por hora.")
                .setRequired(true)
                .setMinValue(1)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const role = interaction.options.getRole("rol");
        const amount = interaction.options.getInteger("cantidad");

        await interaction.deferReply({ ephemeral: false });

        try {
            const income = await IncomeRole.findOneAndUpdate(
                { guildId, roleId: role.id },
                { incomePerHour: amount },
                { upsert: true, new: true }
            );

            const embed = new ThemedEmbed(interaction)
                .setTitle("💼 Salario configurado")
                .setDescription(
                    `El rol ${role} ahora cobrará **$${amount} por hora** de servicio.`
                )
                .setColor("#2ecc71");

            await safeReply(interaction, { embeds: [embed] });

            logger.info(
                `${interaction.user.tag} configuró income de ${role.name} a $${amount}/hora`,
                "IncomeRole"
            );
        } catch (err) {
            logger.error("Error en /setincome:", err);

            await safeReply(interaction, {
                content: "❌ Hubo un error al guardar el salario del rol."
            });
        }
    },
};

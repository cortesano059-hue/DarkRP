// src/commands/economia/withdraw.js
const { SlashCommandBuilder } = require('discord.js');
try {
    const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
    const eco = require('@economy');
    const safeReply = require("@src/utils/safeReply.js");

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('withdraw')
            .setDescription('Retirar dinero del banco.')
            .addStringOption(o =>
                o.setName('cantidad')
                 .setDescription('Cantidad o "all" para todo')
                 .setRequired(true)
            ),

        async execute(interaction) {
            await interaction.deferReply({ ephemeral: false });
            try {
                let amount = interaction.options.getString('cantidad');
                const balance = await eco.getBalance(interaction.user.id, interaction.guild.id);

                if (amount.toLowerCase() === 'all') amount = balance.bank;
                else amount = parseInt(amount);

                if (!amount || amount <= 0) {
                    return await safeReply(interaction, { embeds: [ThemedEmbed.error('❌ Error', 'Cantidad inválida.')] });
                }

                const result = await eco.withdraw(interaction.user.id, interaction.guild.id, amount);
                if (!result.success) {
                    return await safeReply(interaction, { embeds: [ThemedEmbed.error('❌ Error', result.message)] });
                }

                const newBalance = await eco.getBalance(interaction.user.id, interaction.guild.id);

                const embed = new ThemedEmbed(interaction)
                    .setTitle('💰 Retiro Exitoso')
                    .setColor('#2ecc71')
                    .setDescription(`Has retirado **$${amount}** de tu banco.`)
                    .addFields(
                        { name: 'Usuario', value: `${interaction.user.tag}`, inline: true },
                        { name: 'Dinero en mano', value: `$${newBalance.balance}`, inline: true },
                        { name: 'Dinero en el banco', value: `$${newBalance.bank}`, inline: true }
                    );

                return await safeReply(interaction, { embeds: [embed] });

            } catch (err) {
                console.error('❌ ERROR EN COMANDO withdraw.js:', err);
                return await safeReply(interaction, { embeds: [ThemedEmbed.error('❌ Error', 'No se pudo retirar el dinero.')] });
            }
        }
    };
} catch (e) {
    console.error('❌ ERROR EN COMANDO withdraw.js:', e);
}

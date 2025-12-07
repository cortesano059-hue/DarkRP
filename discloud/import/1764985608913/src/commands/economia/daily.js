// src/commands/economia/daily.js
const { SlashCommandBuilder } = require('discord.js');
try {
    const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
    const eco = require('@economy');
    const safeReply = require("@src/utils/safeReply.js");

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('daily')
            .setDescription('Reclama tu recompensa diaria.'),

        async execute(interaction) {
            await interaction.deferReply({ ephemeral: false }); // Visible para todos
            try {
                const userId = interaction.user.id;
                const guildId = interaction.guild.id;

                const cooldownTime = eco.DAILY_COOLDOWN;
                const balance = await eco.getBalance(userId, guildId);
                const lastClaim = balance.dailyClaim || 0;
                const now = Date.now();

                if (now < lastClaim + cooldownTime) {
                    const remaining = lastClaim + cooldownTime - now;
                    const hours = Math.floor(remaining / 3600000);
                    const minutes = Math.floor((remaining % 3600000) / 60000);
                    const seconds = Math.floor((remaining % 60000) / 1000);

                    return await safeReply(interaction, {
                        embeds: [ThemedEmbed.error(
                            '⏳ Cooldown Activo',
                            `Ya reclamaste tu daily. Vuelve en ${hours}h ${minutes}m ${seconds}s.`
                        )]
                    });
                }

                // Recompensas aleatorias
                const actions = [
                    { text: 'Hoy encontraste un tesoro escondido', min: 1000, max: 2000 },
                    { text: 'Recibiste un pago por un trabajo especial', min: 1500, max: 3000 },
                    { text: 'Tu inversión diaria dio frutos', min: 2000, max: 4000 },
                    { text: 'La suerte estuvo de tu lado hoy', min: 2500, max: 5000 },
                    { text: 'Alguien te recompensó por tu ayuda', min: 1200, max: 2500 }
                ];

                const action = actions[Math.floor(Math.random() * actions.length)];
                const amount = Math.floor(Math.random() * (action.max - action.min + 1)) + action.min;

                // Dar dinero
                await eco.addMoney(userId, guildId, amount);

                // Actualizar daily_claim_at
                await eco.claimDaily(userId, guildId, 0); // 0 porque ya sumamos dinero en addMoney

                const newBalance = await eco.getBalance(userId, guildId);

                const embed = new ThemedEmbed(interaction)
                    .setTitle('🎁 Recompensa Diaria')
                    .setColor('#2ecc71')
                    .setDescription(`${action.text} y ganaste **$${amount}**.`)
                    .addFields(
                        { name: 'Usuario', value: `${interaction.user.tag}`, inline: true },
                        { name: 'Dinero en mano', value: `$${newBalance.balance}`, inline: true },
                        { name: 'Dinero en el banco', value: `$${newBalance.bank}`, inline: true }
                    );

                return await safeReply(interaction, { embeds: [embed] });

            } catch (err) {
                console.error('❌ ERROR EN COMANDO daily.js:', err);
                return await safeReply(interaction, {
                    embeds: [ThemedEmbed.error('Error', 'No se pudo reclamar la daily.')]
                });
            }
        }
    };
} catch(e) {
    console.error('❌ ERROR EN COMANDO daily.js:', e);
}

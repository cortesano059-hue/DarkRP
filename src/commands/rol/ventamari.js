const { SlashCommandBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const eco = require('@economy');
const logger = require("@src/utils/logger.js"); // nuestro logger con webhook

const COOLDOWN = 15000; // 15 segundos
const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vender-mari')
    .setDescription('Vender mercancía ilegal.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const now = Date.now();

    // Cooldown
    if (cooldowns.has(userId) && now - cooldowns.get(userId) < COOLDOWN) {
      const remaining = ((COOLDOWN - (now - cooldowns.get(userId))) / 1000).toFixed(1);
      return safeReply(interaction, { content: `⏱️ Debes esperar ${remaining}s antes de vender otra vez.` });
    }
    cooldowns.set(userId, now);

    await interaction.deferReply();

    try {
      const balanceData = await eco.getBalance(userId, interaction.guild.id);
      const balance = balanceData.balance;

      // Riesgo base + extra riesgo según dinero
      const baseRisk = 0.25;
      const extraRisk = Math.min(balance / 50000, 0.2);
      const finalRisk = baseRisk + extraRisk;

      const chance = Math.random();
      if (chance < finalRisk) {
        // Fallo por policía
        logger.warn(`[Vender-Mari] Usuario ${userId} fue atrapado por la policía y perdió la mercancía.`);
        return safeReply(interaction, {
          embeds: [
            ThemedEmbed.error(
              '🚨 ¡La policía!',
              'Te han descubierto y perdiste la mercancía.'
            )
          ]
        });
      }

      // Loot variable
      const lootTable = [
        { name: 'Pequeña cantidad de marihuana', min: 200, max: 400, chance: 0.5 },
        { name: 'Paquete mediano', min: 400, max: 700, chance: 0.35 },
        { name: 'Paquete grande', min: 700, max: 1200, chance: 0.15 }
      ];

      let cumulative = 0;
      const lootRoll = Math.random();
      let loot = lootTable[0];
      for (const l of lootTable) {
        cumulative += l.chance;
        if (lootRoll < cumulative) {
          loot = l;
          break;
        }
      }

      const earnings = Math.floor(Math.random() * (loot.max - loot.min + 1)) + loot.min;
      await eco.addMoney(userId, interaction.guild.id, earnings);

      logger.info(`[Vender-Mari] Usuario ${userId} vendió ${loot.name} y ganó $${earnings}.`);

      return safeReply(interaction, {
        embeds: [
          new ThemedEmbed(interaction)
            .setTitle('🌿 Venta Exitosa')
            .setColor('#2ecc71')
            .setDescription(`Has vendido **${loot.name}** y ganado **$${earnings}**.`)
        ]
      });

    } catch (err) {
      logger.error(`[Vender-Mari] Error ejecutando comando: ${err}`);
      return safeReply(interaction, { content: '❌ Ocurrió un error al vender la mercancía.' });
    }
  }
};

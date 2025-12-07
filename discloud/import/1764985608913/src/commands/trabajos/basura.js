const { SlashCommandBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const eco = require("@economy");
const logger = require("@src/utils/logger.js");

const BROKEN_BOTTLE = "Botella rota";
const COOLDOWN = 15000;
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("basura")
        .setDescription("Buscar en la basura."),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const now = Date.now();

        // ==============================
        //   COOLDOWN
        // ==============================
        if (cooldowns.has(userId) && now - cooldowns.get(userId) < COOLDOWN) {
            const remaining = (
                (COOLDOWN - (now - cooldowns.get(userId))) / 1000
            ).toFixed(1);

            return safeReply(interaction, {
                content: `⏱️ Debes esperar ${remaining}s antes de buscar otra vez.`
            });
        }
        cooldowns.set(userId, now);

        await interaction.deferReply();

        try {
            const roll = Math.random();

            // ==============================
            // 5% → Botella rota
            // ==============================
            if (roll < 0.05) {
                let bottle = await eco.getItemByName(guildId, BROKEN_BOTTLE);

                // Crear el ítem si no existe
                if (!bottle) {
                    bottle = await eco.createItem(guildId, BROKEN_BOTTLE, {
                        description: "Una botella rota. Cuidado con los cortes.",
                        price: 1000,
                        type: "trash",
                        data: { broken: true }
                    });
                }

                // Añadir al inventario
                await eco.addToInventory(userId, guildId, bottle.id, 1);

                await safeReply(interaction, {
                    embeds: [
                        new ThemedEmbed(interaction)
                            .setTitle("🩸 ¡Te has cortado!")
                            .setDescription(
                                "Encontraste una **botella rota** y te hiciste daño.\n\nLa botella fue añadida a tu inventario."
                            )
                            .setColor("#c0392b")
                    ]
                });

                logger.info(`${interaction.user.tag} obtuvo Botella rota`, "Basura");
                return;
            }

            // ==============================
            // 30% → No encuentra nada
            // ==============================
            if (roll < 0.35) {
                await safeReply(interaction, {
                    embeds: [
                        new ThemedEmbed(interaction)
                            .setDescription("🗑️ No encontraste nada útil esta vez.")
                            .setColor("#7f8c8d")
                    ]
                });

                logger.info(`${interaction.user.tag} no encontró nada`, "Basura");
                return;
            }

            // ==============================
            // 65% → Premios de dinero
            // ==============================

            const lootTable = [
                { name: "Botellas", min: 10, max: 50 },
                { name: "Monedas antiguas", min: 20, max: 120 },
                { name: "Chatarra valiosa", min: 50, max: 200 },
                { name: "Latas", min: 5, max: 25 },
                { name: "Tapones", min: 3, max: 15 },
                { name: "Restos de metal", min: 20, max: 80 }
            ];

            const loot = lootTable[Math.floor(Math.random() * lootTable.length)];
            const reward =
                Math.floor(Math.random() * (loot.max - loot.min + 1)) + loot.min;

            // Añadir dinero **a la mano**
            await eco.addMoney(userId, guildId, reward);

            await safeReply(interaction, {
                embeds: [
                    ThemedEmbed.success(
                        "Búsqueda Terminada",
                        `Encontraste **${loot.name}** y ganaste **$${reward}**.`
                    )
                ]
            });

            logger.info(
                `${interaction.user.tag} obtuvo ${loot.name} y $${reward}`,
                "Basura"
            );

        } catch (err) {
            logger.error(`Error ejecutando /basura: ${err}`, "Basura");

            await safeReply(interaction, {
                content: "❌ Ocurrió un error al ejecutar el comando."
            });
        }
    }
};

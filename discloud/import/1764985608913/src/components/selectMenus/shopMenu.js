// src/components/selectMenus/shopMenu.js
const eco = require("@src/database/economy.js");
const safeReply = require("@src/utils/safeReply.js");

module.exports = {
    // Esto no se usa como key exacta
    // Se registrará por check()
    customId: "tienda_buy",

    // Aceptar CUALQUIER menú que empiece por tienda_buy_
    check: id => id.startsWith("tienda_buy_"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const selected = interaction.values[0]; // Nombre del item
        if (!selected)
            return safeReply(interaction, { content: "❌ No seleccionaste ningún item." });

        // Intentamos comprar el item
        const result = await eco.buyItemByName(userId, guildId, selected);

        if (!result.success) {
            return safeReply(interaction, {
                content: `❌ ${result.message || "No se pudo comprar el item."}`,
                flags: 64 // ephemeral real (en v14 deprecated pero necesario)
            });
        }

        const item = result.item;

        return safeReply(interaction, {
            content: `✅ **${item.name}** comprado por **$${item.price}**`,
            flags: 64
        });
    }
};

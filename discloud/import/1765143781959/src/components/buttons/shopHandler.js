// src/components/buttons/shopHandler.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const eco = require("@src/database/economy.js");
const safeReply = require("@src/utils/safeReply.js");

const ITEMS_PER_PAGE = 8;

module.exports = {
    customId: "shop_open",

    // Detecta: shop_open · tienda_prev_X · tienda_next_X · shop_close
    check: id =>
        id === "shop_open" ||
        id === "shop_close" ||
        id.startsWith("tienda_prev") ||
        id.startsWith("tienda_next"),

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        let page = 0;

        // Si es paginación
        if (interaction.customId.startsWith("tienda_prev_"))
            page = parseInt(interaction.customId.split("_")[2]) - 1;

        if (interaction.customId.startsWith("tienda_next_"))
            page = parseInt(interaction.customId.split("_")[2]) + 1;

        return renderShop(interaction, client, guildId, userId, page);
    }
};

async function renderShop(interaction, client, guildId, userId, pageIndex = 0) {
    const items = await eco.getShop(guildId);
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

    pageIndex = Math.max(0, Math.min(totalPages - 1, pageIndex));

    const start = pageIndex * ITEMS_PER_PAGE;
    const pageItems = items.slice(start, start + ITEMS_PER_PAGE);

    // Banner (opcional: pon imágen si quieres)
    const embedBanner = new EmbedBuilder()
        .setImage("https://cdn.discordapp.com/attachments/1438575452288581632/1445207801331712214/image.png?ex=693570e6&is=69341f66&hm=28d659750188201993b61af5af33cd1e27583eb58da5470e4e44c181a01a73c8&") // — cambia por tu banner
        .setColor("#2b2d31");

    // Embed principal
    const embed = new EmbedBuilder()
        .setTitle(`🛒 Tienda (Página ${pageIndex + 1}/${totalPages})`)
        .setColor("#2b2d31")
        .setThumbnail(client.user.displayAvatarURL())
         .setImage("https://cdn.discordapp.com/attachments/1438575452288581632/1445213527617966201/Tienda_abajo.png?ex=6935763b&is=693424bb&hm=c63621c8f9d0d1315e4fc34e7476a97842b73cba9f6f513bd7ce5d4ac41da1d6&")
        .setDescription(
            pageItems.length
                ? pageItems
                      .map((it, i) => `**${start + i + 1}. ${it.itemName}** — $${it.price}\n${it.description}`)
                      .join("\n\n")
                : "No hay artículos disponibles."
        )
        .setFooter({
            text: `Mostrando ${start + 1}-${start + pageItems.length} de ${items.length} artículos.`
        });

    // Menú desplegable para comprar items
    const select = new StringSelectMenuBuilder()
        .setCustomId(`tienda_buy_${userId}`)
        .setPlaceholder("🛒 Selecciona un artículo para comprar")
        .addOptions(
            items.map(it => ({
                label: `${it.itemName} ($${it.price})`,
                value: it.itemName,
                description: (it.description || "Sin descripción").slice(0, 50)
            }))
        );

    const rowSelect = new ActionRowBuilder().addComponents(select);

    // Botones
    const rowButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`tienda_prev_${pageIndex}`)
            .setLabel("⬅️ Anterior")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(pageIndex === 0),

        new ButtonBuilder()
            .setCustomId("shop_close")
            .setLabel("Cerrar")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId(`tienda_next_${pageIndex}`)
            .setLabel("Siguiente ➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(pageIndex >= totalPages - 1)
    );

    // Editar respuesta previa o responder nuevo
    if (interaction.replied || interaction.deferred) {
        return interaction.editReply({
            embeds: [embedBanner, embed],
            components: [rowSelect, rowButtons]
        });
    }

    return safeReply(interaction, {
        embeds: [embedBanner, embed],
        components: [rowSelect, rowButtons]
    });
}

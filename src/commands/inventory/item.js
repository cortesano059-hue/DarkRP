// src/commands/economia/item.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply.js");
const eco = require("@economy"); // USAR ECONOMY OFICIAL

function esc(str) {
    return new RegExp("^" + str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("item")
        .setDescription("Sistema completo de items (crear, editar, borrar, dar, quitar, info, comprar).")

        // ADMIN — CREAR
        .addSubcommand(sub =>
            sub.setName("crear")
                .setDescription("Crear un item (admins).")
                .addStringOption(o => o.setName("nombre").setDescription("Nombre del item").setRequired(true))
                .addIntegerOption(o => o.setName("precio").setDescription("Precio").setRequired(true))
                .addStringOption(o => o.setName("descripcion").setDescription("Descripción"))
                .addStringOption(o => o.setName("emoji").setDescription("Emoji"))
        )

        // ADMIN — EDITAR
        .addSubcommand(sub =>
            sub.setName("editar")
                .setDescription("Editar un item (admins).")
                .addStringOption(o => o.setName("nombre").setDescription("Actual").setRequired(true))
                .addStringOption(o => o.setName("nuevo_nombre").setDescription("Nuevo nombre"))
                .addIntegerOption(o => o.setName("precio").setDescription("Nuevo precio"))
                .addStringOption(o => o.setName("descripcion").setDescription("Nueva descripción"))
                .addStringOption(o => o.setName("emoji").setDescription("Nuevo emoji"))
        )

        // ADMIN — ELIMINAR
        .addSubcommand(sub =>
            sub.setName("eliminar")
                .setDescription("Eliminar un item (admins).")
                .addStringOption(o => o.setName("nombre").setDescription("Item").setRequired(true))
        )

        // ADMIN — DAR
        .addSubcommand(sub =>
            sub.setName("dar")
                .setDescription("Dar item a usuario (admins).")
                .addUserOption(o => o.setName("usuario").setDescription("Usuario").setRequired(true))
                .addStringOption(o => o.setName("nombre").setDescription("Item").setRequired(true))
                .addIntegerOption(o => o.setName("cantidad").setDescription("Cantidad").setRequired(true))
        )

        // ADMIN — QUITAR
        .addSubcommand(sub =>
            sub.setName("quitar")
                .setDescription("Quitar item del usuario (admins).")
                .addUserOption(o => o.setName("usuario").setDescription("Usuario").setRequired(true))
                .addStringOption(o => o.setName("nombre").setDescription("Item").setRequired(true))
                .addIntegerOption(o => o.setName("cantidad").setDescription("Cantidad").setRequired(true))
        )

        // USER — COMPRAR
        .addSubcommand(sub =>
            sub.setName("comprar")
                .setDescription("Comprar item de la tienda.")
                .addStringOption(o => o.setName("nombre").setDescription("Item").setRequired(true))
                .addIntegerOption(o => o.setName("cantidad").setDescription("Cantidad").setRequired(true))
        )

        // USER — INFO
        .addSubcommand(sub =>
            sub.setName("info")
                .setDescription("Información del item")
                .addStringOption(o => o.setName("nombre").setDescription("Item").setRequired(true))
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const sub = interaction.options.getSubcommand();
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);

        const adminCmds = ["crear", "editar", "eliminar", "dar", "quitar"];
        if (adminCmds.includes(sub) && !isAdmin) {
            return safeReply(interaction, "❌ No tienes permisos para esto.", true);
        }

        try {
            /* ========================= CREAR ========================= */
            if (sub === "crear") {
                const name = interaction.options.getString("nombre");
                const price = interaction.options.getInteger("precio");
                const desc = interaction.options.getString("descripcion") || "";
                const emoji = interaction.options.getString("emoji") || "📦";

                const exists = await eco.getItemByName(guildId, name);
                if (exists) return safeReply(interaction, "❌ Ya existe un item con ese nombre.");

                await eco.createItem(guildId, name, price, desc, emoji);

                return safeReply(interaction, `✅ Item **${name}** creado.`);
            }

            /* ========================= EDITAR ========================= */
            if (sub === "editar") {
                const name = interaction.options.getString("nombre");
                const newName = interaction.options.getString("nuevo_nombre");
                const price = interaction.options.getInteger("precio");
                const desc = interaction.options.getString("descripcion");
                const emoji = interaction.options.getString("emoji");

                const item = await eco.getItemByName(guildId, name);
                if (!item) return safeReply(interaction, "❌ No existe ese item.");

                if (newName) item.itemName = newName;
                if (price !== null) item.price = price;
                if (desc !== null) item.description = desc;
                if (emoji) item.emoji = emoji;

                await item.save();

                return safeReply(interaction, `✏️ Item **${item.itemName}** actualizado.`);
            }

            /* ========================= ELIMINAR ========================= */
            if (sub === "eliminar") {
                const name = interaction.options.getString("nombre");
                const deleted = await eco.deleteItem(guildId, name);

                if (!deleted) return safeReply(interaction, "❌ No existe ese item.");

                return safeReply(interaction, `🗑️ Item **${name}** eliminado.`);
            }

            /* ========================= DAR ========================= */
            if (sub === "dar") {
                const u = interaction.options.getUser("usuario");
                const name = interaction.options.getString("nombre");
                const amount = interaction.options.getInteger("cantidad");

                const ok = await eco.addToInventory(u.id, guildId, name, amount);

                if (!ok) return safeReply(interaction, "❌ No existe ese item.");

                return safeReply(interaction, `🎁 Entregado **${amount}x ${name}** a <@${u.id}>.`);
            }

            /* ========================= QUITAR ========================= */
            if (sub === "quitar") {
                const u = interaction.options.getUser("usuario");
                const name = interaction.options.getString("nombre");
                const amount = interaction.options.getInteger("cantidad");

                const ok = await eco.removeItem(u.id, guildId, name, amount);

                if (!ok.success)
                    return safeReply(interaction, "❌ Ese usuario no tiene suficientes items.");

                return safeReply(interaction, `🗑️ Quitado **${amount}x ${name}** a <@${u.id}>.`);
            }

            /* ========================= COMPRAR ========================= */
            if (sub === "comprar") {
                const name = interaction.options.getString("nombre");
                const amount = interaction.options.getInteger("cantidad");

                const result = await eco.buyItem(interaction.user.id, guildId, name, amount);

                if (!result.success)
                    return safeReply(interaction, "❌ " + result.message);

                const embed = new EmbedBuilder()
                    .setTitle("🛒 Compra realizada")
                    .setColor("#2ecc71")
                    .setDescription(`Has comprado **${amount}x ${name}** por **$${result.total}**.`)
                    .addFields({ name: "💵 Nuevo saldo", value: `${result.newBalance}` });

                return safeReply(interaction, { embeds: [embed] });
            }

            /* ========================= INFO ========================= */
            if (sub === "info") {
                const name = interaction.options.getString("nombre");

                const item = await eco.getItemByName(guildId, name);
                if (!item) return safeReply(interaction, "❌ No existe ese item.");

                const embed = new EmbedBuilder()
                    .setTitle(`${item.emoji} ${item.itemName}`)
                    .setColor("#3498db")
                    .setDescription(item.description || "Sin descripción.")
                    .addFields(
                        { name: "💰 Precio", value: `${item.price}`, inline: true },
                        { name: "📦 Tipo", value: item.type, inline: true }
                    );

                return safeReply(interaction, { embeds: [embed] });
            }

        } catch (err) {
            console.error("❌ Error en /item:", err);
            return safeReply(interaction, "❌ Hubo un error ejecutando el comando.");
        }
    }
};

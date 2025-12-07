const { EmbedBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js"); // ✅ Faltaba esto

// Lista manual de comandos (Asegúrate de mantenerla actualizada)
const categoryCommands = {
    dni: [
        "/creardni - Crea tu DNI",
        "/dni - Muestra tu DNI",
        "/deldni - Elimina tu DNI"
    ],
    ilegal: [
        "/venta-mari - Vender marihuana"
    ],
    moderacion: [
        "/ban - Banear usuario",
        "/ping - Ver latencia",
        "/borrarlocales - Limpiar comandos"
    ],
    movil: [
        "/twiter - Publicar un tweet"
    ],
    party: [
        "/party - Crear una party"
    ],
    policia: [
        "/esposar - Esposar usuario",
        "/desesposar - Quitar esposas",
        "/escoltar - Escoltar usuario",
        "/desescoltar - Soltar usuario"
    ],
    rol: [
        "/me - Acción de personaje",
        "/do - Descripción de entorno/acción",
        "/entorno - Mensaje de entorno",
        "/anonimo - Mensaje anónimo",
        "/onduty - Entrar en servicio",
        "/offduty - Salir de servicio"
    ],
    trabajos: [
        "/work - Trabajar",
        "/basura - Buscar en la basura"
    ],
    economia: [
        "/balance - Ver dinero",
        "/pay - Pagar a otro usuario",
        "/deposit - Depositar en banco",
        "/withdraw - Retirar de banco",
        "/daily - Recompensa diaria",
        "/shop - Ver tienda",
        "/itembuy - Comprar ítem",
        "/inventario - Ver tus ítems",
        "/giveitem - Dar ítem (Admin)",
        "/itemcreate - Crear ítem (Admin)"
    ]
};

module.exports = {
    customId: "select_category",
    async execute(interaction) {
        const category = interaction.values[0];
        const commands = categoryCommands[category] || ["No hay comandos en esta categoría."];
        
        const embed = new EmbedBuilder()
            .setTitle(`📦 Comandos de la categoría: ${category.toUpperCase()}`)
            .setDescription(
                `Aquí tienes los comandos disponibles:\n\n` +
                commands.map(cmd => `• ${cmd}`).join("\n")
            )
            .setColor('#3498DB')
            .setFooter({ text: `Consultado por: ${interaction.user.tag}` })
            .setTimestamp();

        // ✅ Corregido: solo un await y safeReply importado
        await safeReply(interaction, { embeds: [embed], ephemeral: true });
    }
};
const { SlashCommandBuilder } = require('discord.js');
const eco = require("@economy");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const safeReply = require("@src/utils/safeReply.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pay")
        .setDescription("Envía dinero a otro usuario.")
        .addUserOption(option =>
            option.setName("usuario")
                .setDescription("Usuario al que pagar")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("cantidad")
                .setDescription("Cantidad a enviar")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("desde")
                .setDescription("Desde dónde enviar el dinero")
                .addChoices(
                    { name: "Dinero en mano", value: "money" },
                    { name: "Banco", value: "bank" }
                )
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const sender = interaction.user;
        const receiver = interaction.options.getUser("usuario");
        const amount = interaction.options.getInteger("cantidad");
        const method = interaction.options.getString("desde");
        const guildId = interaction.guild.id;

        // Validaciones
        if (receiver.bot)
            return safeReply(interaction, { content: "❌ No puedes pagar a bots." });

        if (receiver.id === sender.id)
            return safeReply(interaction, { content: "❌ No puedes pagarte a ti mismo." });

        if (amount <= 0)
            return safeReply(interaction, { content: "❌ La cantidad debe ser mayor a 0." });

        const senderBal = await eco.getBalance(sender.id, guildId);

        // Validar según método
        if (method === "money" && senderBal.balance < amount)
            return safeReply(interaction, { content: "❌ No tienes suficiente dinero en mano." });

        if (method === "bank" && senderBal.bank < amount)
            return safeReply(interaction, { content: "❌ No tienes suficiente dinero en el banco." });

        // Transferencia
        if (method === "money") {
            await eco.removeMoney(sender.id, guildId, amount, "money");
            await eco.addMoney(receiver.id, guildId, amount, "money");
        } else {
            await eco.removeMoney(sender.id, guildId, amount, "bank");
            await eco.addMoney(receiver.id, guildId, amount, "money");
        }

        // Saldos actualizados
        const newSender = await eco.getBalance(sender.id, guildId);
        const newReceiver = await eco.getBalance(receiver.id, guildId);

        // Embed FINAL válido para Discord
        const embed = new ThemedEmbed(interaction)
            .setTitle("💸 Transferencia Exitosa")
            .setDescription(
                `Has pagado **$${amount.toLocaleString()}** a ${receiver} desde **${method === "money" ? "tu cartera" : "tu banco"}**.`
            )
            .addFields(
                {
                    name: "Emisor",
                    value: `${sender}`
                },
                {
                    name: "Dinero en mano",
                    value: `$${newSender.balance.toLocaleString()}`,
                    inline: true
                },
                {
                    name: "Dinero en banco",
                    value: `$${newSender.bank.toLocaleString()}`,
                    inline: true
                },
                {
                    name: "Receptor",
                    value: `${receiver}`
                },
                {
                    name: "Dinero en mano",
                    value: `$${newReceiver.balance.toLocaleString()}`,
                    inline: true
                },
                {
                    name: "Dinero en banco",
                    value: `$${newReceiver.bank.toLocaleString()}`,
                    inline: true
                }
            );

        return safeReply(interaction, { embeds: [embed] });
    }
};

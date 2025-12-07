// src/commands/trabajos/work.js
const { SlashCommandBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const eco = require("@economy");
const ms = require("ms");

const COOLDOWN = 60 * 60 * 1000; // 1 hora

const jobs = [
    { message: "Has trabajado como 🚕 taxista y ganaste", min: 50, max: 150 },
    { message: "Ayudaste en una 🏪 tienda y recibiste", min: 80, max: 200 },
    { message: "Repartiste 📦 paquetes y te pagaron", min: 70, max: 180 },
    { message: "Trabajaste de 🍕 repartidor y ganaste", min: 60, max: 170 },
    { message: "Hiciste un pequeño trabajo de 🧰 mecánico y ganaste", min: 90, max: 220 },

    { message: "Hiciste de 🧹 conserje limpiando un edificio y ganaste", min: 40, max: 120 },
    { message: "Actuaste como 👮 vigilante de seguridad y recibiste", min: 120, max: 260 },
    { message: "Ayudaste a un agricultor 🌾 recogiendo cosechas y te pagaron", min: 70, max: 190 },
    { message: "Fuiste 🎧 DJ en una pequeña fiesta y ganaste", min: 150, max: 300 },
    { message: "Trabajaste como 🧑‍🍳 ayudante de cocina y recibiste", min: 100, max: 240 },
    { message: "Fuiste contratado como 🚚 transportista y ganaste", min: 110, max: 260 },
    { message: "Actuaste como 🛠️ técnico reparando electrodomésticos y recibiste", min: 130, max: 280 },
    { message: "Ayudaste en un evento como 🎤 animador y te pagaron", min: 160, max: 320 },
    { message: "Tomaste fotos como 📸 fotógrafo freelance y ganaste", min: 90, max: 250 },
    { message: "Hiciste de 🧑‍🏫 tutor ayudando a un estudiante y recibiste", min: 80, max: 180 },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("work")
        .setDescription("Trabaja y gana dinero."),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const balance = await eco.getBalance(userId, guildId);
        const now = Date.now();
        const cooldownEnd = Number(balance.workCooldown) || 0;

        // ❌ COOLDOWN ACTIVO
        if (cooldownEnd > now) {
            const remaining = Math.max(cooldownEnd - now, 1);
            const formatted = ms(remaining, { long: true });

            const embed = new ThemedEmbed(interaction)
                .setTitle("❌ ⏳ Estás cansado")
                .setColor("Red")
                .setDescription(`Podrás volver a trabajar **en ${formatted}**.`);

            return interaction.editReply({ embeds: [embed] });
        }

        // 🎲 TRABAJO RNG
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const reward = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

        await eco.addMoney(userId, guildId, reward);
        await eco.setWorkCooldown(userId, guildId, now + COOLDOWN);

        const embed = new ThemedEmbed(interaction)
            .setTitle("💼 ¡Has trabajado!")
            .setColor("Green")
            .setDescription(`${job.message} **${reward}$** 💰`);

        return interaction.editReply({ embeds: [embed] });
    },
};

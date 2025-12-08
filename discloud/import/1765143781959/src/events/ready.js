// src/events/ready.js
const { Events, REST, Routes } = require('discord.js');
const logger = require("@src/utils/logger.js"); // tu logger actual
require('dotenv').config();

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        console.log(`🤖 Logged in as ${client.user.tag}`);
        logger.info(`Bot conectado como ${client.user.tag}`);

        const GUILD_ID = process.env.GUILD_ID;
        if (!GUILD_ID) {
            logger.error('No se encontró GUILD_ID en el .env');
            return;
        }

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        try {
            logger.info(`Registrando ${client.commandsArray.length} comandos en el servidor ${GUILD_ID}...`);
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, GUILD_ID),
                { body: client.commandsArray }
            );
            logger.info('✅ Comandos registrados con éxito.');
        } catch (error) {
            logger.error(`Error al registrar comandos: ${error}`);
        }
    },
};

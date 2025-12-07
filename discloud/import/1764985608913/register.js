// src/register.js
const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

module.exports = async (client) => {
    // Inicializar colecciones si no existen
    client.commands ??= new Map();
    client.commandArray ??= [];

    // Cargar todos los comandos
    const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`); // usa ruta relativa si @commands falla
        if (command.data) {
            client.commands.set(command.data.name, command);
            client.commandArray.push(command.data.toJSON());
        }
    }

    // Registrar comandos solo cuando el cliente esté listo
    client.once('ready', async () => {
        console.log(`${client.user.tag} está listo. Registrando comandos...`);

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        try {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
                { body: client.commandArray }
            );
            console.log('✅ Comandos registrados correctamente.');
        } catch (error) {
            console.error('❌ Error al registrar comandos:', error);
        }
    });
};

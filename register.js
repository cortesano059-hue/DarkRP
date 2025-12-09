const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

module.exports = async (client) => {

    const commands = [];
    const commandsPath = path.join(__dirname, "src", "commands"); 
    // 🔥 Ruta corregida → apunta a /src/commands

    // Función recursiva para leer subcarpetas
    function loadCommands(dir) {
        if (!fs.existsSync(dir)) return; // evita crashear si no existe

        const files = fs.readdirSync(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);

            if (fs.lstatSync(fullPath).isDirectory()) {
                loadCommands(fullPath);
                continue;
            }

            if (!file.endsWith(".js")) continue;

            const command = require(fullPath);

            if (command?.data) {
                commands.push(command.data.toJSON());
                client.commands.set(command.data.name, command);
            }
        }
    }

    // Cargar TODOS los comandos
    loadCommands(commandsPath);

    console.log(`📦 Comandos cargados: ${commands.length}`);

    // Registrar cuando esté listo
    client.once("ready", async () => {
        console.log(`🛰 Registrando comandos como ${client.user.tag}...`);

        const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

        try {
            await rest.put(
                Routes.applicationGuildCommands(
                    process.env.CLIENT_ID,
                    process.env.GUILD_ID
                ),
                { body: commands }
            );

            console.log("✅ Comandos registrados con éxito.");
        } catch (e) {
            console.error("❌ Error al registrar comandos:", e);
        }
    });
};
const { SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deploy')
        .setDescription('Recarga y registra los comandos (Solo Owner).'),
    
    async execute(interaction) {
        // 1. SEGURIDAD: Comprobar si es el Owner
        // Asegúrate de tener OWNER_ID en tu archivo .env
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ 
                content: '⛔ No tienes permiso para usar este comando.', 
                ephemeral: true 
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const commandsData = [];
        const commandsPath = path.join(__dirname, '../commands'); // Ajusta si tu estructura es diferente
        
        // Obtenemos archivos .js (excluyendo este mismo archivo si quieres evitar bucles raros, aunque no es estricto)
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        let errorCount = 0;

        try {
            // 2. RECARGA EN CALIENTE (Hot Reload)
            // Esto es vital: Borramos la memoria caché de los archivos para que el bot lea el código nuevo.
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                
                // Borramos la caché antigua de ese archivo
                delete require.cache[require.resolve(filePath)];

                try {
                    // Requerimos el archivo "fresco"
                    const command = require(filePath);
                    
                    // Actualizamos la colección del cliente (para que el bot sepa ejecutar el nuevo código)
                    if (command.data && command.execute) {
                        interaction.client.commands.set(command.data.name, command);
                        commandsData.push(command.data.toJSON());
                    }
                } catch (err) {
                    console.error(`Error al cargar ${file}:`, err);
                    errorCount++;
                }
            }

            // 3. REGISTRO EN LA API DE DISCORD
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

            console.log(`Iniciando actualización de ${commandsData.length} comandos (API)...`);

            // Usamos applicationGuildCommands para que sea instantáneo en tu server de pruebas
            await rest.put(
                Routes.applicationGuildCommands(interaction.client.user.id, process.env.GUILD_ID),
                { body: commandsData }
            );

            // 4. RESPUESTA FINAL
            let msg = `✅ **Éxito:** Se han registrado/recargado ${commandsData.length} comandos.`;
            if (errorCount > 0) msg += `\n⚠️ Hubo errores en ${errorCount} archivos (mira la consola).`;

            await interaction.editReply(msg);

        } catch (error) {
            console.error(error);
            await interaction.editReply(`❌ **Error crítico:** ${error.message}`);
        }
    }
};
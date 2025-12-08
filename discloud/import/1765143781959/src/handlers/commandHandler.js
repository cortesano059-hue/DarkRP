// src/handlers/commandHandler.js
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

// Función para resolver el alias a una ruta absoluta del sistema de archivos
const resolveAliasPath = (alias) => {
    // Esto asume que module-alias ya ha sido cargado en index.js
    // Si la ruta no está disponible, se intentará una ruta relativa por defecto.
    try {
        // En Node.js, obtener la ruta absoluta del alias @commands
        const commandsAliasPath = require('module-alias')._aliases['@commands'];
        if (commandsAliasPath) {
            // Unir la ruta base del proyecto con la ruta del alias
            return path.join(process.cwd(), commandsAliasPath);
        }
    } catch (e) {
        console.warn('⚠ No se pudo resolver el alias @commands. Usando ruta relativa por defecto.');
    }
    // Ruta relativa por defecto (la que falló antes, como fallback)
    return path.join(__dirname, '..', 'commands');
};

module.exports = async function commandHandler(client) {
    const commands = [];
    
    // **USO DE RUTA ABSOLUTA GARANTIZADA POR ALIAS**
    const commandsDir = resolveAliasPath('@commands');

    const traverse = (dir) => {
        // Validación para evitar el error si la ruta es nula o no existe
        if (!fs.existsSync(dir)) {
            console.error(`❌ Directorio de comandos no encontrado: ${dir}`);
            return;
        }
        
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) traverse(full);
            else if (entry.name.endsWith('.js')) {
                try {
                    delete require.cache[require.resolve(full)];
                    const cmd = require(full);

                    if (cmd && cmd.data && cmd.execute) {
                        client.commands.set(cmd.data.name, cmd);
                        commands.push(cmd.data.toJSON());
                        console.log(`✔ Comando cargado: ${cmd.data.name}`);
                    } else {
                        console.warn(`⚠ Comando inválido o incompleto: ${full}`);
                    }
                } catch (err) {
                    console.error(`🔴 Error cargando comando ${full}:`, err);
                }
            }
        }
    };

    traverse(commandsDir);

    client.commandArray = commands;

    // --- REGISTRO REST EN DISCORD ---
    const restToken = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID;

    if (!restToken || !clientId) {
        console.warn('⚠ Faltan DISCORD_TOKEN o CLIENT_ID. Los comandos no se registrarán via REST.');
        return;
    }

    const rest = new REST({ version: '10' }).setToken(restToken);

    try {
        // Si el array de comandos está vacío, saltamos la llamada a REST para evitar el TypeError
        if (commands.length === 0) {
             console.warn('⚠ Array de comandos vacío. No se registró nada en Discord.');
             return;
        }

        console.log(`🔁 Registrando ${commands.length} comandos globales en Discord...`);
        
        // La llamada a rest.put debe funcionar ahora que commands tiene contenido
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log(`✅ Registrados ${commands.length} comandos globales.`);
        
    } catch (err) {
        console.error('❌ Error registrando comandos con REST:', err);
    }
};
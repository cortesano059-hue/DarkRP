const safeReply = require('@src/utils/safeReply');
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const ThemedEmbed = require('@src/utils/ThemedEmbed');
const Emojis = require('@src/config/EmojiList');
const Categories = require('@src/config/categories');
const fs = require('fs');
const path = require('path');
const { version } = require('../../../package.json');

// 📸 CONFIGURACIÓN DE IMÁGENES Y COLORES
const IMAGEN_SUPERIOR = 'https://cdn.discordapp.com/attachments/1438575452288581632/1445212702690508851/comandos.png?ex=6932d277&is=693180f7&hm=30874b503c99f89848218bff488491b3691c40c9cffd443ebc6456e7c86c03b5&'; 
const IMAGEN_INFERIOR = 'https://cdn.discordapp.com/attachments/1438575452288581632/1445213520194179163/Help__Comandos.png?ex=6932d339&is=693181b9&hm=b6cbbc97d69783bb7ee4d1b04838a753c7a2ab972023709b1583b5f4849cc395&';

// 🎨 COLOR UNIFICADO PARA TODO EL COMANDO
const COLOR_PRINCIPAL = '#2b2d31'; 

// FUNCIÓN MÁGICA: Busca archivos .js en todas las subcarpetas
const getAllFiles = (dirPath, arrayOfFiles = []) => {
    try {
        const files = fs.readdirSync(dirPath);
        files.forEach((file) => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                getAllFiles(fullPath, arrayOfFiles);
            } else {
                if (file.endsWith('.js')) {
                    arrayOfFiles.push(fullPath);
                }
            }
        });
    } catch (e) {
        // Si la carpeta no existe, ignoramos
    }
    return arrayOfFiles;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comandos')
        .setDescription('Muestra una lista de todos los comandos disponibles.'),
    
    async execute(interaction, client) {
        await interaction.deferReply();
        const helpData = getHelpMessage(client, interaction);
        
        // Enviamos los embeds y el menú
        return await safeReply(interaction, helpData);
    }
};

function getHelpMessage(client, interaction) {
    const commandsPath = path.join(__dirname, '../');
    
    // 1. Detectar categorías leyendo carpetas
    const commandFolders = fs.readdirSync(commandsPath).filter(folder => {
        const folderPath = path.join(commandsPath, folder);
        return fs.statSync(folderPath).isDirectory();
    });
    
    const commandCount = client.commandArray ? client.commandArray.length : 0;
    
    // --- EMBED 1: BANNER SUPERIOR (Solo imagen) ---
    const embedBanner = new EmbedBuilder()
        .setImage(IMAGEN_SUPERIOR)
        .setColor(COLOR_PRINCIPAL); // Usa el color unificado

    // --- EMBED 2: INFORMACIÓN (Con la segunda imagen) ---
    const embedInfo = new ThemedEmbed()
        .setColor(COLOR_PRINCIPAL) // Usa el color unificado (Sobrescribe el del Theme)
        .setTitle(`${Emojis.info || 'ℹ️'} Menú de Ayuda`)
        .setDescription('Usa el menú de abajo para seleccionar una categoría y ver sus comandos.')
        .addFields([
            {
                name: `${Emojis.gear || '⚙️'} Comandos Totales`,
                value: `> \`${commandCount}\``,
                inline: true,
            },
            {
                name: `${Emojis.flechaderlong || '➡️'} Latencia`,
                value: `> \`${Math.abs(client.ws.ping)}ms\``,
                inline: true,
            },
            {
                name: `${Emojis.box || '📦'} Versión`,
                value: `> \`${version}\``,
                inline: true,
            },
            {
                name: `${Emojis.search || '🔍'} Categorías Disponibles`,
                value: `>>> ${commandFolders.map(folder => {
                    const categoryConfig = Categories[folder] || Categories['Sin categoría'];
                    const emoji = categoryConfig?.EMOJI || Emojis.gear || '📁';
                    return `${emoji} **${folder.toUpperCase()}**`;
                }).join('\n')}`,
                inline: false,
            },
        ])
        .setThumbnail(client.user.displayAvatarURL())
        .setImage(IMAGEN_INFERIOR) 
        .setFooter({
            text: `Solicitado por ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL(),
        });

    // --- MENÚ DESPLEGABLE ---
    const menuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`help-category-${interaction.user.id}`) // ID único con usuario
            .setPlaceholder('Selecciona una categoría')
            .addOptions(
                commandFolders.map(folder => {
                    const folderPath = path.join(commandsPath, folder);
                    const commandFiles = getAllFiles(folderPath);
                    const categoryConfig = Categories[folder] || Categories['Sin categoría'];
                    const emoji = categoryConfig?.EMOJI || Emojis.gear || '📁';
                    
                    return {
                        label: folder.toUpperCase(),
                        value: folder,
                        description: `${commandFiles.length} comandos disponibles`,
                        emoji: emoji,
                    };
                }),
            ),
    );
    
    return { embeds: [embedBanner, embedInfo], components: [menuRow] };
}

// Esta función es llamada por el Handler cuando cambias de categoría
function buildCategoryEmbeds(client, interaction, category) {
    const commandsPath = path.join(__dirname, '../', category);
    
    // --- EMBED 1: BANNER SUPERIOR (Siempre se mantiene) ---
    const embedBanner = new EmbedBuilder()
        .setImage(IMAGEN_SUPERIOR)
        .setColor(COLOR_PRINCIPAL); // Usa el color unificado

    if (!fs.existsSync(commandsPath)) {
        const errorEmbed = new ThemedEmbed()
            .setColor(COLOR_PRINCIPAL) // Usa el color unificado
            .setTitle(`${Emojis.error || '❌'} Error`)
            .setDescription(`La categoría **${category.toUpperCase()}** no existe o está vacía.`)
            .setImage(IMAGEN_INFERIOR)
            .setFooter({ text: interaction.user.username });
        return [embedBanner, errorEmbed];
    }
    
    const commandFiles = getAllFiles(commandsPath);
    const categoryConfig = Categories[category] || Categories['Sin categoría'];
    const categoryEmoji = categoryConfig?.EMOJI || Emojis.gear || '📁';
    
    if (commandFiles.length === 0) {
        const emptyEmbed = new ThemedEmbed()
            .setColor(COLOR_PRINCIPAL) // Usa el color unificado
            .setTitle(`${categoryEmoji} Categoría: ${category.toUpperCase()}`)
            .setDescription('Esta categoría no tiene comandos disponibles.')
            .setImage(IMAGEN_INFERIOR)
            .setFooter({ text: interaction.user.username });
        return [embedBanner, emptyEmbed];
    }

    const commandsText = commandFiles.map(file => {
        const fileName = path.basename(file); 
        const commandName = fileName.replace('.js', '');
        
        const command = client.commands.get(commandName);
        if (command && command.data) {
            return `**${Emojis.flechaderlong || '➡️'} /${command.data.name}**\n> ${command.data.description || 'Sin descripción'}`;
        }
        return `**${Emojis.flechaderlong || '➡️'} ${commandName}**\n> Sin descripción`;
    }).join('\n\n');
    
    // --- EMBED 2: LISTA DE COMANDOS ---
    const embedCategory = new ThemedEmbed()
        .setColor(COLOR_PRINCIPAL) // Usa el color unificado
        .setTitle(`${categoryEmoji} Categoría: ${category.toUpperCase()}`)
        .setDescription(commandsText)
        .setThumbnail(client.user.displayAvatarURL())
        .setImage(IMAGEN_INFERIOR) 
        .setFooter({ 
            text: `${commandFiles.length} comando(s) | ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL()
        });
    
    return [embedBanner, embedCategory];
}

module.exports.buildCategoryEmbeds = buildCategoryEmbeds;
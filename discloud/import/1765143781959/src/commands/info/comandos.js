// src/commands/info/comandos.js
const safeReply = require('@src/utils/safeReply');
const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    EmbedBuilder 
} = require('discord.js');

const ThemedEmbed = require('@src/utils/ThemedEmbed');
const Emojis = require('@src/config/EmojiList');
const Categories = require('@src/config/categories');

const fs = require('fs');
const path = require('path');
const { version } = require('../../../package.json');

// Banner superior
const IMAGEN_SUPERIOR =
    'https://cdn.discordapp.com/attachments/1438575452288581632/1445212702690508851/comandos.png';

// Banner inferior
const IMAGEN_INFERIOR =
    'https://cdn.discordapp.com/attachments/1438575452288581632/1445213520194179163/Help__Comandos.png';

const COLOR_PRINCIPAL = '#2b2d31';

// Función recursiva para obtener todos los archivos JS dentro de una carpeta
const getAllFiles = (dir, arr = []) => {
    if (!fs.existsSync(dir)) return arr;

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const full = path.join(dir, file);

        if (fs.statSync(full).isDirectory()) {
            getAllFiles(full, arr);
        } else if (file.endsWith('.js')) {
            arr.push(full);
        }
    }
    return arr;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comandos')
        .setDescription('Muestra una lista de todos los comandos disponibles.'),

    async execute(interaction, client) {
        await interaction.deferReply();

        const helpData = getHelpMessage(client, interaction);

        return safeReply(interaction, helpData);
    }
};

function getHelpMessage(client, interaction) {
    const commandsRoot = path.join(__dirname, '../');

    // Carpeta = categoría
    const commandFolders = fs
        .readdirSync(commandsRoot)
        .filter((folder) => fs.statSync(path.join(commandsRoot, folder)).isDirectory());

    const commandCount = client.commandArray?.length ?? 0;

    // Banner superior
    const embedBanner = new EmbedBuilder()
        .setImage(IMAGEN_SUPERIOR)
        .setColor(COLOR_PRINCIPAL);

    // Embed principal
    const embedInfo = new ThemedEmbed()
        .setColor(COLOR_PRINCIPAL)
        .setTitle(`${Emojis.info} Menú de Ayuda`)
        .setDescription('Selecciona una categoría en el menú de abajo.')
        .addFields([
            {
                name: `${Emojis.gear} Comandos Totales`,
                value: `> \`${commandCount}\``,
                inline: true
            },
            {
                name: `${Emojis.flechaderlong} Latencia`,
                value: `> \`${Math.abs(client.ws.ping)}ms\``,
                inline: true
            },
            {
                name: `${Emojis.box} Versión`,
                value: `> \`${version}\``,
                inline: true
            },
            {
                name: `${Emojis.search} Categorías Disponibles`,
                value:
                    '>>> ' +
                    commandFolders
                        .map((folder) => {
                            const cfg = Categories[folder] || Categories['Sin categoría'];
                            return `${cfg.EMOJI} **${folder.toUpperCase()}**`;
                        })
                        .join('\n')
            }
        ])
        .setThumbnail(client.user.displayAvatarURL())
        .setImage(IMAGEN_INFERIOR)
        .setFooter({
            text: `Solicitado por ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL()
        });

    // Menú desplegable
    const menuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`help-category-${interaction.user.id}`)
            .setPlaceholder('Selecciona una categoría')
            .addOptions(
                commandFolders.map((folder) => {
                    const cfg = Categories[folder] || Categories['Sin categoría'];
                    const folderPath = path.join(commandsRoot, folder);
                    const commandFiles = getAllFiles(folderPath);

                    return {
                        label: folder.toUpperCase(),
                        value: folder,
                        description: `${commandFiles.length} comando(s)`,
                        emoji: cfg?.EMOJI ?? Emojis.gear
                    };
                })
            )
    );

    return { embeds: [embedBanner, embedInfo], components: [menuRow] };
}

// Handler cuando seleccionas categoría
function buildCategoryEmbeds(client, interaction, category) {
    const dir = path.join(__dirname, '../', category);

    const embedBanner = new EmbedBuilder()
        .setImage(IMAGEN_SUPERIOR)
        .setColor(COLOR_PRINCIPAL);

    if (!fs.existsSync(dir)) {
        const error = new ThemedEmbed()
            .setColor(COLOR_PRINCIPAL)
            .setTitle(`${Emojis.error} Error`)
            .setDescription(`La categoría **${category.toUpperCase()}** no existe.`)
            .setImage(IMAGEN_INFERIOR);

        return [embedBanner, error];
    }

    const files = getAllFiles(dir);

    const cfg = Categories[category] || Categories['Sin categoría'];
    const emoji = cfg?.EMOJI ?? Emojis.gear;

    if (files.length === 0) {
        const empty = new ThemedEmbed()
            .setColor(COLOR_PRINCIPAL)
            .setTitle(`${emoji} Categoría: ${category.toUpperCase()}`)
            .setDescription('No hay comandos en esta categoría.')
            .setImage(IMAGEN_INFERIOR);

        return [embedBanner, empty];
    }

    const commandsList = files
        .map((file) => {
            const base = path.basename(file);
            const cmdName = base.replace('.js', '');
            const cmd = client.commands.get(cmdName);

            if (cmd?.data) {
                return `**${Emojis.flechaderlong} /${cmd.data.name}**\n> ${cmd.data.description}`;
            }

            return `**${Emojis.flechaderlong} ${cmdName}**\n> Sin descripción`;
        })
        .join('\n\n');

    const listEmbed = new ThemedEmbed()
        .setColor(COLOR_PRINCIPAL)
        .setTitle(`${emoji} Categoría: ${category.toUpperCase()}`)
        .setDescription(commandsList)
        .setThumbnail(client.user.displayAvatarURL())
        .setImage(IMAGEN_INFERIOR)
        .setFooter({
            text: `${files.length} comando(s) | ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL()
        });

    return [embedBanner, listEmbed];
}

module.exports.buildCategoryEmbeds = buildCategoryEmbeds;

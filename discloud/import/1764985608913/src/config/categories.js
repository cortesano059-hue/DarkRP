// src/config/categories.js
// Configuración de categorías de comandos del bot

const { PermissionFlagsBits } = require('discord.js');
const EmojiList = require("@src/config/EmojiList.js");

module.exports = {
   dni: {
      EMOJI: EmojiList.dni,
      GUILD_ONLY: true,
      PERMISSIONS: []
   },
   economia: {
      EMOJI: EmojiList.economia,
      ALIASES: ["eco", "economy"],
      GUILD_ONLY: true
   },
   ilegal: {
      EMOJI: EmojiList.ilegal,
      GUILD_ONLY: true,
      PERMISSIONS: []
   },
   Info: {
      EMOJI: EmojiList.info,
      ALIASES: ["information", "ayuda"]
   },
   moderacion: {
      EMOJI: EmojiList.moderacion,
      PERMISSIONS: [PermissionFlagsBits.ManageGuild],
      GUILD_ONLY: true
   },
   movil: {
      EMOJI: EmojiList.movil,
      GUILD_ONLY: true
   },
   party: {
      EMOJI: EmojiList.party,
      GUILD_ONLY: true
   },
   policia: {
      EMOJI: EmojiList.policia,
      GUILD_ONLY: true,
      PERMISSIONS: []
   },
   rol: {
      EMOJI: EmojiList.rol,
      GUILD_ONLY: true
   },
   trabajos: {
      EMOJI: EmojiList.trabajos,
      ALIASES: ["work", "jobs"],
      GUILD_ONLY: true
   },
   'Sin categoría': {
      EMOJI: EmojiList.warn,
   },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('esposar')
        .setDescription('Esposa a otro usuario.')
        .addUserOption(option => 
            option.setName('usuario')
                  .setDescription('Usuario a esposar')
                  .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        if (!interaction.guild) {
            return safeReply(interaction, { content: '❌ Este comando solo funciona en servidores.', flags: 64 });
        }

        const user = interaction.options.getMember('usuario');

        if (!user) {
            return safeReply(interaction, { content: '❌ Usuario no encontrado.', flags: 64 });
        }

        // Intentamos obtener al miembro del servidor usando tu GuildMemberManager
        let member = interaction.guild.members.cache.get(user.id);
        if (!member) {
            member = await interaction.guild.members.fetch(user.id).catch(() => null);
        }

        if (!member) {
            return safeReply(interaction, { content: '❌ Usuario no está en este servidor.', flags: 64 });
        }

        if (user.id === interaction.user.id) {
            return safeReply(interaction, { content: '❌ No puedes esposarte a ti mismo.', flags: 64 });
        }

        // Lógica de éxito/fallo
        const success = Math.random() > 0.2; // 80% éxito

        const embed = new EmbedBuilder()
            .setTitle(success ? '🔒 ¡Esposado!' : '❌ Intento fallido')
            .setDescription(success 
                ? `${member.user.tag} ha sido esposado por ${interaction.user.tag}.`
                : `${interaction.user.tag} intentó esposar a ${member.user.tag}, pero falló.`)
            .setColor(success ? '#e74c3c' : '#95a5a6')
            .setTimestamp();

        return safeReply(interaction, { embeds: [embed], flags: 0 }); // visible para todos
    }
};

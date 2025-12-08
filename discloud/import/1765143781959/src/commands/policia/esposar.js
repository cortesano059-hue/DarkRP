const { SlashCommandBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

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
            return safeReply(interaction, { embeds: [ThemedEmbed.error('❌ Error', 'Este comando solo funciona en servidores.')] });
        }

        const user = interaction.options.getMember('usuario');

        if (!user) {
            return safeReply(interaction, { embeds: [ThemedEmbed.error('❌ Error', 'Usuario no encontrado.')] });
        }

        let member = interaction.guild.members.cache.get(user.id);
        if (!member) {
            member = await interaction.guild.members.fetch(user.id).catch(() => null);
        }

        if (!member) {
            return safeReply(interaction, { embeds: [ThemedEmbed.error('❌ Error', 'Usuario no está en este servidor.')] });
        }

        if (user.id === interaction.user.id) {
            return safeReply(interaction, { embeds: [ThemedEmbed.error('❌ Error', 'No puedes esposarte a ti mismo.')] });
        }

        const success = Math.random() > 0.2;

        const embed = success 
            ? ThemedEmbed.success('🔒 ¡Esposado!', `${member.user.tag} ha sido esposado por ${interaction.user.tag}.`)
            : ThemedEmbed.error('❌ Intento fallido', `${interaction.user.tag} intentó esposar a ${member.user.tag}, pero falló.`);
        
        if (!success) embed.setColor('#95a5a6'); 
        
        embed.setTimestamp();

        return safeReply(interaction, { embeds: [embed], flags: 0 });
    }
};

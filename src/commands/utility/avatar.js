const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Displays a user\'s avatar in high quality.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose avatar you want to see (optional)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;

            const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 4096 });

            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle(`Avatar for ${targetUser.username}`)
                .setImage(avatarURL)
                .setTimestamp()
                .setFooter({ text: 'Vazha Bot | Avatar' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('PNG')
                        .setStyle(ButtonStyle.Link)
                        .setURL(targetUser.displayAvatarURL({ format: 'png', size: 4096 })),
                    new ButtonBuilder()
                        .setLabel('JPG')
                        .setStyle(ButtonStyle.Link)
                        .setURL(targetUser.displayAvatarURL({ format: 'jpg', size: 4096 })),
                    new ButtonBuilder()
                        .setLabel('WEBP')
                        .setStyle(ButtonStyle.Link)
                        .setURL(targetUser.displayAvatarURL({ format: 'webp', size: 4096 }))
                );
            
            await interaction.reply({ embeds: [embed], components: [row] });

        } catch (error) {
            Logger.error(`Error in avatar command: ${error.message}`, 'Avatar');
            await interaction.reply({ content: 'An error occurred while fetching the avatar.', ephemeral: true });
        }
    }
};
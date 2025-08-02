const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Displays detailed information about a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get information about (optional)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const targetUser = interaction.options.getUser('user') || interaction.user;
            const targetMember = await interaction.guild.members.fetch(targetUser.id);

            if (!targetMember) {
                const embed = EmbedBuilderUtil.error('User Not Found', 'Could not find the specified user in this server.');
                return interaction.editReply({ embeds: [embed], ephemeral: true });
            }

            // --- Basic Info ---
            const username = targetUser.tag;
            const nickname = targetMember.nickname || 'None';
            const userId = targetUser.id;

            // --- Dates ---
            const createdDate = `<t:${Math.floor(targetUser.createdAt.getTime() / 1000)}:f>`;
            const joinedDate = `<t:${Math.floor(targetMember.joinedAt.getTime() / 1000)}:f>`;

            // --- Roles ---
            const roles = targetMember.roles.cache
                .filter(role => role.id !== interaction.guild.id) // Exclude @everyone
                .map(role => role.toString());
            const roleCount = roles.length;
            const rolesString = roleCount > 0 ? roles.join(', ') : 'None';
            const highestRole = targetMember.roles.highest.toString();

            // --- Permissions ---
            const permissions = targetMember.permissions.toArray();
            const keyPermissions = [
                'Administrator',
                'BanMembers',
                'KickMembers',
                'ManageChannels',
                'ManageGuild',
                'ManageMessages',
                'ManageRoles',
            ].filter(perm => permissions.includes(perm));
            const permsString = keyPermissions.length > 0 ? keyPermissions.join(', ') : 'None';
            
            // --- Build Embed ---
            const embed = new EmbedBuilder()
                .setColor(targetMember.displayHexColor === '#000000' ? config.colors.primary : targetMember.displayHexColor)
                .setTitle('User Information')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .setAuthor({ name: username, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
                .addFields(
                    { name: '👤 User', value: `**Tag:** ${username}\n**ID:** ${userId}`, inline: true },
                    { name: '📝 Nickname', value: nickname, inline: true },
                    { name: '👑 Highest Role', value: highestRole, inline: true },
                    { name: '📅 Account Created', value: createdDate, inline: false },
                    { name: '📥 Joined Server', value: joinedDate, inline: false },
                    { name: `🎭 Roles (${roleCount})`, value: rolesString.length > 1024 ? `${roles.slice(0, 15).join(', ')}...` : rolesString, inline: false },
                    { name: '🔑 Key Permissions', value: permsString, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Vazha Bot | User Info' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            Logger.error(`Error in userinfo command: ${error.message}`, 'UserInfo');
            await interaction.editReply({ content: 'An error occurred while fetching user information.', ephemeral: true });
        }
    }
};
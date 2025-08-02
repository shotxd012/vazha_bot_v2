const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedBuilderUtil = require('../../utils/embedBuilder');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('delete_messages')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)),
    
    permissions: [PermissionFlagsBits.BanMembers],
    cooldown: 10,
    
    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const deleteMessageDays = interaction.options.getInteger('delete_messages') || 0;
            
            // Check if target user is the bot itself
            if (targetUser.id === interaction.client.user.id) {
                const embed = EmbedBuilderUtil.error(
                    'Cannot Ban Bot',
                    'I cannot ban myself!'
                );
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
            
            // Check if target user is the command user
            if (targetUser.id === interaction.user.id) {
                const embed = EmbedBuilderUtil.error(
                    'Cannot Ban Yourself',
                    'You cannot ban yourself!'
                );
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
            
            // Check if target user is the server owner
            if (targetUser.id === interaction.guild.ownerId) {
                const embed = EmbedBuilderUtil.error(
                    'Cannot Ban Owner',
                    'You cannot ban the server owner!'
                );
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
            
            // Check if bot has permission to ban the target user
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            
            if (targetMember) {
                // Check if target user has higher permissions than the bot
                if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                    const embed = EmbedBuilderUtil.error(
                        'Cannot Ban User',
                        'I cannot ban this user because they have higher or equal permissions than me.'
                    );
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    return;
                }
                
                // Check if target user has higher permissions than the command user
                if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                    const embed = EmbedBuilderUtil.error(
                        'Cannot Ban User',
                        'You cannot ban this user because they have higher or equal permissions than you.'
                    );
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    return;
                }
            }
            
            // Defer reply since ban operation might take time
            await interaction.deferReply();
            
            try {
                // Ban the user
                await interaction.guild.members.ban(targetUser, {
                    reason: `${reason} | Banned by ${interaction.user.tag}`,
                    deleteMessageDays: deleteMessageDays
                });
                
                // Create success embed
                const embed = EmbedBuilderUtil.moderation(
                    'ban',
                    targetUser,
                    reason,
                    interaction.user
                );
                
                // Add additional information
                embed.addFields({
                    name: 'Message Deletion',
                    value: deleteMessageDays > 0 ? `${deleteMessageDays} day(s) of messages deleted` : 'No messages deleted',
                    inline: true
                });
                
                await interaction.editReply({ embeds: [embed] });
                
                // Log the ban action
                Logger.info(`User ${targetUser.tag} (${targetUser.id}) was banned from ${interaction.guild.name} by ${interaction.user.tag}`, 'BanCommand');
                
                // Update user stats in database
                try {
                    const User = require('../../database/models/user');
                    const userDoc = await User.findOne({ userId: targetUser.id });
                    
                    if (userDoc) {
                        userDoc.moderation.bans.push({
                            reason: reason,
                            moderator: interaction.user.id,
                            timestamp: new Date()
                        });
                        await userDoc.save();
                    }
                } catch (dbError) {
                    Logger.error(`Error updating user ban record: ${dbError.message}`, 'BanCommand');
                }
                
            } catch (banError) {
                Logger.error(`Error banning user: ${banError.message}`, 'BanCommand');
                
                const embed = EmbedBuilderUtil.error(
                    'Ban Failed',
                    `Failed to ban ${targetUser.tag}. Make sure I have the necessary permissions and the user is not protected.`
                );
                
                await interaction.editReply({ embeds: [embed] });
            }
            
        } catch (error) {
            Logger.error(`Error in ban command: ${error.message}`, 'BanCommand');
            throw new Error(`Failed to execute ban command: ${error.message}`);
        }
    }
}; 
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedBuilderUtil = require('../../utils/embedBuilder');
const ModerationLog = require('../../database/models/moderationLog');
const Logger = require('../../utils/logger');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)),
    
    permissions: [PermissionFlagsBits.KickMembers],
    cooldown: 10,
    
    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // --- Initial Checks ---
            if (targetUser.id === interaction.user.id) {
                const embed = EmbedBuilderUtil.error('Cannot Kick Self', 'You cannot kick yourself.');
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            if (targetUser.id === interaction.client.user.id) {
                const embed = EmbedBuilderUtil.error('Cannot Kick Bot', 'You cannot kick the bot.');
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
            
            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            if (!targetMember) {
                const embed = EmbedBuilderUtil.error('User Not Found', 'Could not find the specified user in this server.');
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            // --- Permission Checks ---
            const botMember = await interaction.guild.members.fetch(interaction.client.user.id);

            if (!targetMember.kickable) {
                const embed = EmbedBuilderUtil.error(
                    'Cannot Kick User',
                    'I do not have sufficient permissions to kick this user. This is usually because they have a higher role than me or are the server owner.'
                );
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
            
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                const embed = EmbedBuilderUtil.error(
                    'Permission Denied',
                    'You cannot kick this user because they have a higher or equal role than you.'
                );
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            // Defer reply since the operation might take time
            await interaction.deferReply();
            
            // --- DM Notification ---
            try {
                const dmEmbed = EmbedBuilderUtil.info(
                    `You have been kicked from ${interaction.guild.name}`,
                    `You were kicked for the following reason: **${reason}**`
                );
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                Logger.warn(`Could not DM user ${targetUser.tag} after kick: ${dmError.message}`, 'KickCommand');
            }
            
            // --- Kick User ---
            await targetMember.kick(reason);

            // --- Log Moderation ---
            const newLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                action: 'Kick',
                reason: reason,
            });
            await newLog.save();
            Logger.info(`Kick for user ${targetUser.tag} saved to database.`, 'KickCommand');

            // --- Confirmation Reply ---
            const successEmbed = EmbedBuilderUtil.success(
                'User Kicked',
                `Successfully kicked **${targetUser.tag}** for: **${reason}**`
            );
            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            Logger.error(`Error in kick command: ${error.message}`, 'KickCommand');
            const errorEmbed = EmbedBuilderUtil.error(
                'An Error Occurred',
                'An unexpected error occurred while trying to kick the user.'
            );
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
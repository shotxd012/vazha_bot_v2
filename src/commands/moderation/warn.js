const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedBuilderUtil = require('../../utils/embedBuilder');
const ModerationLog = require('../../database/models/moderationLog');
const Logger = require('../../utils/logger');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user and log it')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true)), // Reason is required for warnings

    permissions: [PermissionFlagsBits.ModerateMembers], // Same permission as timeout
    cooldown: 5,

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');

            // --- Initial Checks ---
            if (targetUser.id === interaction.user.id) {
                const embed = EmbedBuilderUtil.error('Cannot Warn Self', 'You cannot warn yourself.');
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            if (targetUser.bot) {
                const embed = EmbedBuilderUtil.error('Cannot Warn Bot', 'You cannot warn a bot.');
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            await interaction.deferReply();

            // --- Log Moderation ---
            const newLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                action: 'Warn',
                reason: reason,
            });
            await newLog.save();
            Logger.info(`Warning for user ${targetUser.tag} saved to database. Case ID: ${newLog.caseId}`, 'WarnCommand');

            // --- DM Notification ---
            try {
                const dmEmbed = EmbedBuilderUtil.warning(
                    `You have been warned in ${interaction.guild.name}`,
                    `You received a warning for the following reason: **${reason}**.\n\nThis is official case #${newLog.caseId}.`
                );
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                Logger.warn(`Could not DM user ${targetUser.tag} for warning: ${dmError.message}`, 'WarnCommand');
            }

            // --- Confirmation Reply ---
            const successEmbed = EmbedBuilderUtil.success(
                'User Warned',
                `Successfully warned **${targetUser.tag}** for: **${reason}** (Case #${newLog.caseId})`
            );
            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            Logger.error(`Error in warn command: ${error.message}`, 'WarnCommand');
            const errorEmbed = EmbedBuilderUtil.error('An Error Occurred', 'An unexpected error occurred while trying to warn the user.');
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
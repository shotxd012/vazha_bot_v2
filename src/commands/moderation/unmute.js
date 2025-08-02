const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedBuilderUtil = require('../../utils/embedBuilder');
const ModerationLog = require('../../database/models/moderationLog');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Remove a timeout from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to unmute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the unmute')
                .setRequired(false)),

    permissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 10,

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            if (!targetMember) {
                return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
            }

            // --- Permission & State Checks ---
            if (!targetMember.moderatable) {
                const embed = EmbedBuilderUtil.error('Cannot Unmute User', 'I do not have permissions to manage this user.');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (!targetMember.isCommunicationDisabled()) {
                const embed = EmbedBuilderUtil.info('User Not Muted', 'This user is not currently muted.');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            await interaction.deferReply();

            // --- Remove Timeout ---
            await targetMember.timeout(null, reason); // Set timeout to null to remove it

            // --- Log Moderation ---
            const newLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                action: 'Unmute',
                reason: reason,
            });
            await newLog.save();
            Logger.info(`Unmute for user ${targetUser.tag} saved to database.`, 'UnmuteCommand');

            // --- DM Notification ---
            try {
                const dmEmbed = EmbedBuilderUtil.success(
                    `You have been unmuted in ${interaction.guild.name}`,
                    `Your timeout has been removed.`
                );
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                Logger.warn(`Could not DM user ${targetUser.tag} for unmute: ${dmError.message}`, 'UnmuteCommand');
            }
            
            // --- Confirmation Reply ---
            const successEmbed = EmbedBuilderUtil.success(
                'User Unmuted',
                `Successfully unmuted **${targetUser.tag}**.`
            );
            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            Logger.error(`Error in unmute command: ${error.message}`, 'UnmuteCommand');
            const errorEmbed = EmbedBuilderUtil.error('An Error Occurred', 'An unexpected error occurred while trying to unmute the user.');
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedBuilderUtil = require('../../utils/embedBuilder');
const ModerationLog = require('../../database/models/moderationLog');
const Logger = require('../../utils/logger');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user by applying a timeout')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration of the mute (e.g., 10m, 1h, 7d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false)),

    permissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 10,

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user');
            const durationString = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            
            const durationMs = ms(durationString);
            if (!durationMs || durationMs < 5000 || durationMs > 2419200000) { // 5s to 28d
                const embed = EmbedBuilderUtil.error(
                    'Invalid Duration',
                    'Please provide a valid duration between 5 seconds and 28 days (e.g., 10m, 1h, 7d).'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            if (!targetMember) {
                return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
            }

            // --- Permission Checks ---
            if (!targetMember.moderatable) {
                const embed = EmbedBuilderUtil.error(
                    'Cannot Mute User',
                    'I cannot mute this user. This is usually because they have a higher role than me or are the server owner.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                const embed = EmbedBuilderUtil.error(
                    'Permission Denied',
                    'You cannot mute this user because they have a higher or equal role than you.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            await interaction.deferReply();

            // --- Apply Timeout ---
            await targetMember.timeout(durationMs, reason);
            
            // --- Log Moderation ---
            const newLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                action: 'Mute',
                reason: reason,
                duration: new Date(Date.now() + durationMs)
            });
            await newLog.save();
            Logger.info(`Mute for user ${targetUser.tag} saved to database.`, 'MuteCommand');

            // --- DM Notification ---
            try {
                const dmEmbed = EmbedBuilderUtil.warning(
                    `You have been muted in ${interaction.guild.name}`,
                    `You were muted for **${ms(durationMs, { long: true })}** for the following reason: **${reason}**.`
                );
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                Logger.warn(`Could not DM user ${targetUser.tag} for mute: ${dmError.message}`, 'MuteCommand');
            }

            // --- Confirmation Reply ---
            const successEmbed = EmbedBuilderUtil.success(
                'User Muted',
                `Successfully muted **${targetUser.tag}** for **${ms(durationMs, { long: true })}**.`
            );
            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            Logger.error(`Error in mute command: ${error.message}`, 'MuteCommand');
            const errorEmbed = EmbedBuilderUtil.error('An Error Occurred', 'An unexpected error occurred while trying to mute the user.');
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
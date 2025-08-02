const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedBuilderUtil = require('../../utils/embedBuilder');
const ModerationLog = require('../../database/models/moderationLog');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server using their ID')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The ID of the user to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the unban')
                .setRequired(false)),

    permissions: [PermissionFlagsBits.BanMembers],
    cooldown: 10,

    async execute(interaction) {
        try {
            const userIdToUnban = interaction.options.getString('userid');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // --- Permission Check ---
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
                const embed = EmbedBuilderUtil.error('Permission Denied', 'I do not have the permission to unban members.');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            await interaction.deferReply();
            
            // --- Fetch and Unban User ---
            const bannedUser = await interaction.guild.bans.fetch(userIdToUnban).catch(() => null);

            if (!bannedUser) {
                const embed = EmbedBuilderUtil.error('User Not Banned', 'This user is not currently banned from this server.');
                return interaction.editReply({ embeds: [embed] });
            }

            await interaction.guild.members.unban(userIdToUnban, reason);

            // --- Log Moderation ---
            const newLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: userIdToUnban,
                moderatorId: interaction.user.id,
                action: 'Unban',
                reason: reason,
            });
            await newLog.save();
            Logger.info(`Unban for user ID ${userIdToUnban} saved to database.`, 'UnbanCommand');
            
            // --- Confirmation Reply ---
            const successEmbed = EmbedBuilderUtil.success(
                'User Unbanned',
                `Successfully unbanned user **${bannedUser.user.tag}**.`
            );
            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            Logger.error(`Error in unban command: ${error.message}`, 'UnbanCommand');
            
            let errorMessage = 'An unexpected error occurred while trying to unban the user.';
            if (error.code === 10026) { // Unknown Ban
                errorMessage = 'This user is not banned or the provided ID is incorrect.';
            } else if (error.code === 50035) { // Invalid Form Body
                 errorMessage = 'Invalid User ID provided. Please check the ID and try again.';
            }

            const errorEmbed = EmbedBuilderUtil.error('An Error Occurred', errorMessage);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/user');
const moment = require('moment');
const Logger = require('../../utils/logger');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userstats')
        .setDescription('Shows global statistics about the bot\'s users.'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            // --- Database Queries ---
            const totalUsers = await User.countDocuments();
            
            const startOfToday = moment().startOf('day').toDate();
            const newUsersToday = await User.countDocuments({ createdAt: { $gte: startOfToday } });
            
            const startOfWeek = moment().startOf('isoWeek').toDate();
            const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: startOfWeek } });

            const topUserDoc = await User.findOne().sort({ 'commandStats.totalCommands': -1 }).limit(1);
            
            let topUserString = 'N/A';
            if (topUserDoc) {
                try {
                    const topUser = await interaction.client.users.fetch(topUserDoc.discordId);
                    topUserString = `**${topUser.tag}** (${topUserDoc.commandStats.totalCommands.toLocaleString()} commands)`;
                } catch {
                    topUserString = `**${topUserDoc.username}** (${topUserDoc.commandStats.totalCommands.toLocaleString()} commands)`;
                }
            }

            // --- Build Embed ---
            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle('Global User Statistics')
                .setDescription('An overview of all users who have interacted with the bot.')
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .addFields(
                    { name: '👥 Total Unique Users', value: `\`${totalUsers.toLocaleString()}\``, inline: true },
                    { name: '☀️ New Users Today', value: `\`${newUsersToday.toLocaleString()}\``, inline: true },
                    { name: '📅 New Users This Week', value: `\`${newUsersThisWeek.toLocaleString()}\``, inline: true },
                    { name: '🏆 Top User', value: topUserString, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Vazha Bot | User Insights' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            Logger.error(`Error in userstats command: ${error.message}`, 'UserStats');
            await interaction.editReply({ content: 'An error occurred while fetching global user statistics.', ephemeral: true });
        }
    }
};
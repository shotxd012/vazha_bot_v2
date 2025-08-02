const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/user');
const Logger = require('../../utils/logger');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('usage')
        .setDescription('Shows your command usage statistics')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view statistics for (optional)')
                .setRequired(false)),

    cooldown: 5,

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const targetUser = interaction.options.getUser('user') || interaction.user;
            const userDoc = await User.findOne({ discordId: targetUser.id });

            if (!userDoc || userDoc.commandStats.totalCommands === 0) {
                const embed = new EmbedBuilder()
                    .setColor(config.colors.info)
                    .setTitle('Usage Statistics')
                    .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() })
                    .setDescription('No usage data found. Start using commands to see your statistics!')
                    .setTimestamp()
                    .setFooter({ text: 'Vazha Bot' });
                
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            // --- Optimized Ranking ---
            const totalCommands = userDoc.commandStats.totalCommands;
            const rank = await User.countDocuments({ 'commandStats.totalCommands': { $gt: totalCommands } }) + 1;
            const totalUsers = await User.countDocuments();


            // --- Build Embed ---
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle('Usage Statistics')
                .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: 'Total Commands Used', value: `\`${totalCommands.toLocaleString()}\``, inline: true },
                    { name: 'Global Rank', value: `\`#${rank} / ${totalUsers}\``, inline: true },
                    { name: 'Last Command', value: `<t:${Math.floor(userDoc.lastSeen.getTime() / 1000)}:R>`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Vazha Bot | Data from the last command used' });

            // --- Top 5 Commands ---
            const commandsUsed = userDoc.commandStats.commandsUsed;
            if (commandsUsed && commandsUsed.size > 0) {
                const sortedCommands = [...commandsUsed.entries()]
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5);

                const topCommandsString = sortedCommands
                    .map(([name, count]) => `• **/${name}**: ${count} time(s)`)
                    .join('\n');

                embed.addFields({
                    name: 'Most Used Commands',
                    value: topCommandsString,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            Logger.error(`Error in usage command: ${error.message}`, 'Usage');
            // Use a more generic error message for the user
            await interaction.editReply({ content: 'An error occurred while fetching usage statistics.', ephemeral: true });
        }
    }
};
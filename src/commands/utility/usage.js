const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('usage')
        .setDescription('Shows your command usage statistics'),
    
    cooldown: 5,
    
    async execute(interaction) {
        try {
            const User = require('../../database/models/user');
            
            // Find user in database
            let userDoc = await User.findOne({ userId: interaction.user.id });
            
            if (!userDoc) {
                const embed = new EmbedBuilder()
                    .setColor(0x2f3136)
                    .setTitle('Usage Statistics')
                    .setDescription('No usage data found. Start using commands to see your statistics!')
                    .setTimestamp()
                    .setFooter({ 
                        text: 'Vazha Bot',
                        iconURL: interaction.client.user.displayAvatarURL()
                    });
                
                await interaction.reply({ embeds: [embed] });
                return;
            }
            
            // Calculate usage percentages and rankings
            const totalCommands = userDoc.stats.usage.total;
            const todayCommands = userDoc.stats.usage.today;
            const monthlyCommands = userDoc.stats.usage.monthly;
            
            // Get user's rank (simplified - you can make this more complex)
            const allUsers = await User.find().sort({ 'stats.usage.total': -1 });
            const userRank = allUsers.findIndex(user => user.userId === interaction.user.id) + 1;
            
            // Get top users for comparison
            const topUsers = allUsers.slice(0, 5);
            
            // Create embed
            const embed = new EmbedBuilder()
                .setColor(0x2f3136)
                .setTitle('Usage Statistics')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ 
                    text: 'Vazha Bot',
                    iconURL: interaction.client.user.displayAvatarURL()
                });
            
            // User overview
            let description = `**User:** ${interaction.user.tag}\n`;
            description += `**Rank:** #${userRank} of ${allUsers.length} users\n`;
            description += `**Level:** ${userDoc.stats.level}\n`;
            description += `**Experience:** ${userDoc.stats.experience} XP\n\n`;
            
            embed.setDescription(description);
            
            // Usage statistics
            const statsFields = [
                {
                    name: 'Today',
                    value: `${todayCommands.toLocaleString()} commands`,
                    inline: true
                },
                {
                    name: 'This Month',
                    value: `${monthlyCommands.toLocaleString()} commands`,
                    inline: true
                },
                {
                    name: 'Total',
                    value: `${totalCommands.toLocaleString()} commands`,
                    inline: true
                },
                {
                    name: 'Last Used',
                    value: userDoc.stats.usage.lastUsed ? 
                        `<t:${Math.floor(userDoc.stats.usage.lastUsed.getTime() / 1000)}:R>` : 
                        'Never',
                    inline: true
                },
                {
                    name: 'Join Date',
                    value: `<t:${Math.floor(userDoc.joinDate.getTime() / 1000)}:F>`,
                    inline: true
                },
                {
                    name: 'Commands Used',
                    value: `${userDoc.stats.commandsUsed.toLocaleString()}`,
                    inline: true
                }
            ];
            
            embed.addFields(statsFields);
            
            // Top users
            if (topUsers.length > 0) {
                const topUsersText = topUsers.map((user, index) => {
                    const rank = index + 1;
                    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                    return `${medal} **${user.username}** - ${user.stats.usage.total.toLocaleString()} commands`;
                }).join('\n');
                
                embed.addFields({
                    name: 'Top Users',
                    value: topUsersText,
                    inline: false
                });
            }
            
            // Progress bar for level (simplified)
            const currentLevel = userDoc.stats.level;
            const currentXP = userDoc.stats.experience;
            const xpForNextLevel = currentLevel * 100;
            const progress = Math.min((currentXP % 100) / 100, 1);
            const progressBar = '█'.repeat(Math.floor(progress * 10)) + '░'.repeat(10 - Math.floor(progress * 10));
            
            embed.addFields({
                name: `Level ${currentLevel} Progress`,
                value: `${progressBar} ${currentXP % 100}/100 XP`,
                inline: false
            });
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            Logger.error(`Error in usage command: ${error.message}`, 'Usage');
            throw new Error(`Failed to execute usage command: ${error.message}`);
        }
    }
}; 
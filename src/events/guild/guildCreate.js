const Logger = require('../../utils/logger');
const EmbedBuilderUtil = require('../../utils/embedBuilder');

module.exports = {
    name: 'guildCreate',
    async execute(guild) {
        try {
            Logger.info(`Joined guild: ${guild.name} (${guild.id})`, 'GuildCreate');
            Logger.info(`Guild owner: ${guild.ownerId}`, 'GuildCreate');
            Logger.info(`Member count: ${guild.memberCount}`, 'GuildCreate');
            
            // Try to send welcome message to system channel or first available channel
            const welcomeChannel = guild.systemChannel || 
                                 guild.channels.cache.find(channel => 
                                     channel.type === 0 && // Text channel
                                     channel.permissionsFor(guild.members.me).has('SendMessages')
                                 );
            
            if (welcomeChannel) {
                const embed = EmbedBuilderUtil.success(
                    'Thanks for adding Vazha Bot!',
                    `I'm excited to be part of **${guild.name}**!\n\n` +
                    '**Quick Start:**\n' +
                    '• Use `/help` to see all available commands\n' +
                    '• Use `/ping` to test my response time\n' +
                    '• Check out `/ban` for moderation features\n\n' +
                    '**Need Help?**\n' +
                    '• Use `/help` for command information\n' +
                    '• Make sure I have the necessary permissions\n\n' +
                    'Enjoy using Vazha Bot! 🎉'
                );
                
                try {
                    await welcomeChannel.send({ embeds: [embed] });
                    Logger.info(`Sent welcome message to ${guild.name}`, 'GuildCreate');
                } catch (error) {
                    Logger.warn(`Could not send welcome message to ${guild.name}: ${error.message}`, 'GuildCreate');
                }
            } else {
                Logger.warn(`No suitable channel found for welcome message in ${guild.name}`, 'GuildCreate');
            }
            
            // Update bot status to reflect new guild count
            const guildCount = guild.client.guilds.cache.size;
            await guild.client.user.setPresence({
                activities: [{
                    name: `Under Construction | ${guildCount} servers`,
                    type: 'PLAYING'
                }],
                status: 'dnd'
            });
            
            Logger.success(`Successfully joined ${guild.name}`, 'GuildCreate');
            
        } catch (error) {
            Logger.error(`Error in guildCreate event: ${error.message}`, 'GuildCreate');
            Logger.debug(`Stack: ${error.stack}`, 'GuildCreate');
        }
    }
}; 
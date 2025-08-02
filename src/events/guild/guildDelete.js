const Logger = require('../../utils/logger');

module.exports = {
    name: 'guildDelete',
    async execute(guild) {
        try {
            Logger.info(`Left guild: ${guild.name} (${guild.id})`, 'GuildDelete');
            Logger.info(`Guild owner: ${guild.ownerId}`, 'GuildDelete');
            Logger.info(`Member count: ${guild.memberCount}`, 'GuildDelete');
            
            // Update bot status to reflect new guild count
            const guildCount = guild.client.guilds.cache.size;
            await guild.client.user.setPresence({
                activities: [{
                    name: `Under Construction | ${guildCount} servers`,
                    type: 'PLAYING'
                }],
                status: 'dnd'
            });
            
            Logger.success(`Successfully left ${guild.name}`, 'GuildDelete');
            
        } catch (error) {
            Logger.error(`Error in guildDelete event: ${error.message}`, 'GuildDelete');
            Logger.debug(`Stack: ${error.stack}`, 'GuildDelete');
        }
    }
}; 
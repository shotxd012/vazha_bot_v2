const Logger = require('../../utils/logger');
const config = require('../../../config/config');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        try {
            // Set bot status
            await client.user.setPresence({
                activities: [{
                    name: config.status.text,
                    type: config.status.type
                }],
                status: 'dnd'
            });

            // Log bot ready information
            Logger.ready('Vazha Bot', client.guilds.cache.size);
            
            // Log additional information
            Logger.info(`Logged in as ${client.user.tag}`, 'Ready');
            Logger.info(`Bot ID: ${client.user.id}`, 'Ready');
            Logger.info(`Serving ${client.guilds.cache.size} guilds`, 'Ready');
            Logger.info(`Serving ${client.users.cache.size} users`, 'Ready');
            
            // Log command statistics
            const commandStats = client.commandHandler.getStats();
            Logger.info(`Loaded ${commandStats.totalCommands} commands in ${commandStats.categories} categories`, 'Ready');
            
            // Log event statistics
            const eventStats = client.eventHandler.getStats();
            Logger.info(`Loaded ${eventStats.totalEvents} events in ${eventStats.categories} categories`, 'Ready');
            
            // Log database connection status
            const DatabaseConnection = require('../../database/connect');
            Logger.info(`Database status: ${DatabaseConnection.getStatus()}`, 'Ready');
            
            // Set up periodic status updates
            setInterval(() => {
                const guildCount = client.guilds.cache.size;
                client.user.setPresence({
                    activities: [{
                        name: `Under Construction | ${guildCount} servers`,
                        type: 'PLAYING'
                    }],
                    status: 'dnd'
                });
            }, 60000); // Update every minute
            
            Logger.success('Bot is now ready to serve!', 'Ready');
            
        } catch (error) {
            Logger.error(`Error in ready event: ${error.message}`, 'Ready');
            Logger.debug(`Stack: ${error.stack}`, 'Ready');
        }
    }
}; 
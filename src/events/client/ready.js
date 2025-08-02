const { ActivityType } = require('discord.js');
const Logger = require('../../utils/logger');
const config = require('../../../config/config');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        try {
            // Initial status set
            client.user.setPresence({
                activities: [{
                    name: config.status.text,
                    type: ActivityType[config.status.type] || ActivityType.Playing, // Use enum and provide fallback
                }],
                status: 'dnd' // Keep the dnd status as requested
            });

            // Log bot ready information
            Logger.ready('Vazha Bot', client.guilds.cache.size);
            
            // Log additional information
            Logger.info(`Logged in as ${client.user.tag}`, 'Ready');
            Logger.info(`Bot ID: ${client.user.id}`, 'Ready');
            Logger.info(`Serving ${client.guilds.cache.size} guilds`, 'Ready');
            
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
                const statusText = `${config.status.text} | ${guildCount} servers`;
                client.user.setPresence({
                    activities: [{
                        name: statusText,
                        type: ActivityType[config.status.type] || ActivityType.Playing,
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

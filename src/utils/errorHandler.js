const Logger = require('./logger');

/**
 * Error handler utility for catching and logging errors
 */
class ErrorHandler {
    /**
     * Handle unhandled promise rejections
     * @param {Error} reason - The rejection reason
     * @param {Promise} promise - The rejected promise
     */
    static handleUnhandledRejection(reason, promise) {
        Logger.error(`Unhandled Promise Rejection: ${reason}`, 'ErrorHandler');
        Logger.debug(`Promise: ${promise}`, 'ErrorHandler');
    }

    /**
     * Handle uncaught exceptions
     * @param {Error} error - The uncaught error
     */
    static handleUncaughtException(error) {
        Logger.error(`Uncaught Exception: ${error.message}`, 'ErrorHandler');
        Logger.debug(`Stack: ${error.stack}`, 'ErrorHandler');
        
        // Exit process on uncaught exception
        process.exit(1);
    }

    /**
     * Handle Discord.js errors
     * @param {Error} error - The Discord.js error
     * @param {string} context - Context where the error occurred
     */
    static handleDiscordError(error, context = '') {
        Logger.error(`Discord.js Error: ${error.message}`, context);
        Logger.debug(`Stack: ${error.stack}`, context);
    }

    /**
     * Handle command execution errors
     * @param {Error} error - The command error
     * @param {Object} interaction - The interaction object
     */
    static async handleCommandError(error, interaction) {
        const errorMessage = error.message || 'An unknown error occurred';
        
        Logger.error(`Command Error: ${errorMessage}`, 'CommandHandler');
        Logger.debug(`Stack: ${error.stack}`, 'CommandHandler');
        
        // Try to reply to the interaction
        try {
            const errorEmbed = {
                color: 0xed4245,
                title: '❌ Command Error',
                description: 'An error occurred while executing this command.',
                fields: [
                    {
                        name: 'Error',
                        value: errorMessage,
                        inline: false
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: 'Vazha Bot'
                }
            };

            // Check if interaction can be replied to
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else if (!interaction.acknowledged) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        } catch (replyError) {
            Logger.error(`Failed to send error message: ${replyError.message}`, 'ErrorHandler');
        }
    }

    /**
     * Handle database errors
     * @param {Error} error - The database error
     * @param {string} context - Context where the error occurred
     */
    static handleDatabaseError(error, context = '') {
        Logger.error(`Database Error: ${error.message}`, context);
        Logger.debug(`Stack: ${error.stack}`, context);
    }

    /**
     * Initialize error handlers
     */
    static initialize() {
        // Handle unhandled promise rejections
        process.on('unhandledRejection', this.handleUnhandledRejection);
        
        // Handle uncaught exceptions
        process.on('uncaughtException', this.handleUncaughtException);
        
        Logger.info('Error handlers initialized', 'ErrorHandler');
    }
}

module.exports = ErrorHandler; 
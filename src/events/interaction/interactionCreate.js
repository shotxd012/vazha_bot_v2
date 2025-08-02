const Logger = require('../../utils/logger');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isButton() || interaction.isModalSubmit() || interaction.isAnySelectMenu()) {
            if (interaction.client.listeners(interaction.customId).length > 0) {
                return;
            }
        }

        try {
            // Route interaction to the interaction handler
            await interaction.client.interactionHandler.handleInteraction(interaction);
            
        } catch (error) {
            Logger.error(`Error handling interaction: ${error.message}`, 'InteractionCreate');
            Logger.debug(`Stack: ${error.stack}`, 'InteractionCreate');
            
            // Try to send error message to user
            try {
                const errorMessage = 'An error occurred while processing your request.';
                
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ 
                        content: errorMessage,
                        ephemeral: true 
                    });
                } else {
                    await interaction.reply({ 
                        content: errorMessage,
                        ephemeral: true 
                    });
                }
            } catch (replyError) {
                Logger.error(`Failed to send error message: ${replyError.message}`, 'InteractionCreate');
            }
        }
    }
}; 
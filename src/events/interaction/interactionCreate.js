const Logger = require('../../utils/logger');
const Welcome = require('../../database/models/welcome');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isModalSubmit() && interaction.customId === 'welcomeEmbedModal') {
            const guildId = interaction.guild.id;
            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');
            const color = interaction.fields.getTextInputValue('color');
            const image = interaction.fields.getTextInputValue('image');
            const footer = interaction.fields.getTextInputValue('footer');

            await Welcome.findOneAndUpdate(
                { guildId },
                {
                    'embed.title': title,
                    'embed.description': description,
                    'embed.color': color,
                    'embed.image': image,
                    'embed.footer.text': footer,
                },
                { upsert: true }
            );

            await interaction.reply({ content: 'Welcome embed updated successfully!', ephemeral: true });
            return;
        }

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
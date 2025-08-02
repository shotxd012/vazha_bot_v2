const Logger = require('../utils/logger');
const ErrorHandler = require('../utils/errorHandler');
const EmbedBuilderUtil = require('../utils/embedBuilder');

/**
 * Interaction Handler for processing Discord interactions
 */
class InteractionHandler {
    constructor(client) {
        this.client = client;
        this.cooldowns = new Map();
    }

    /**
     * Handle all interactions
     * @param {Interaction} interaction - The interaction object
     */
    async handleInteraction(interaction) {
        try {
            // Handle different interaction types
            switch (interaction.type) {
                case 2: // ApplicationCommand
                    await this.handleCommandInteraction(interaction);
                    break;
                case 3: // MessageComponent
                    await this.handleComponentInteraction(interaction);
                    break;
                case 4: // ApplicationCommandAutocomplete
                    await this.handleAutocompleteInteraction(interaction);
                    break;
                case 5: // ModalSubmit
                    await this.handleModalInteraction(interaction);
                    break;
                default:
                    Logger.warn(`Unknown interaction type: ${interaction.type}`, 'InteractionHandler');
            }
        } catch (error) {
            Logger.error(`Error handling interaction: ${error.message}`, 'InteractionHandler');
            Logger.debug(`Stack: ${error.stack}`, 'InteractionHandler');
            
            // Try to send error message to user
            await this.handleInteractionError(interaction, error);
        }
    }

    /**
     * Handle slash command interactions
     * @param {CommandInteraction} interaction - The command interaction
     */
    async handleCommandInteraction(interaction) {
        const commandName = interaction.commandName;
        const command = this.client.commandHandler.getCommand(commandName);

        if (!command) {
            Logger.warn(`Command not found: ${commandName}`, 'InteractionHandler');
            await this.replyWithError(interaction, 'Command not found');
            return;
        }

        // Check permissions
        if (!await this.checkPermissions(interaction, command)) {
            return;
        }

        // Check cooldowns
        if (!await this.checkCooldown(interaction, command)) {
            return;
        }

        // Execute command
        try {
            Logger.info(`Executing command: ${commandName} by ${interaction.user.tag}`, 'InteractionHandler');
            
            // Update user stats in database
            await this.updateUserStats(interaction);
            
            // Execute the command
            await command.execute(interaction);
            
            Logger.debug(`Command ${commandName} executed successfully`, 'InteractionHandler');
            
        } catch (error) {
            await ErrorHandler.handleCommandError(error, interaction);
        }
    }

    /**
     * Handle component interactions (buttons, select menus, etc.)
     * @param {MessageComponentInteraction} interaction - The component interaction
     */
    async handleComponentInteraction(interaction) {
        try {
            const componentId = interaction.customId;
            Logger.debug(`Component interaction: ${componentId}`, 'InteractionHandler');
            
            // Handle different component types
            switch (interaction.componentType) {
                case 1: // ActionRow
                    // ActionRow doesn't have its own handler
                    break;
                case 2: // Button
                    await this.handleButtonInteraction(interaction);
                    break;
                case 3: // StringSelect
                    await this.handleSelectInteraction(interaction);
                    break;
                case 4: // TextInput
                    await this.handleTextInputInteraction(interaction);
                    break;
                case 5: // UserSelect
                case 6: // RoleSelect
                case 7: // MentionableSelect
                case 8: // ChannelSelect
                    await this.handleSelectInteraction(interaction);
                    break;
                default:
                    Logger.warn(`Unknown component type: ${interaction.componentType}`, 'InteractionHandler');
            }
        } catch (error) {
            Logger.error(`Error handling component interaction: ${error.message}`, 'InteractionHandler');
            await this.handleInteractionError(interaction, error);
        }
    }

    /**
     * Handle button interactions
     * @param {ButtonInteraction} interaction - The button interaction
     */
    async handleButtonInteraction(interaction) {
        const buttonId = interaction.customId;
        
        // Example button handlers (can be expanded)
        switch (buttonId) {
            case 'help_close':
                await interaction.update({ content: 'Help menu closed.', embeds: [], components: [] });
                break;
            case 'ping_test':
                const embed = EmbedBuilderUtil.ping(
                    this.client.ws.ping,
                    Date.now() - interaction.createdTimestamp
                );
                await interaction.update({ embeds: [embed] });
                break;
            default:
                Logger.debug(`Unhandled button: ${buttonId}`, 'InteractionHandler');
                await interaction.reply({ content: 'This button is not implemented yet.', ephemeral: true });
        }
    }

    /**
     * Handle select menu interactions
     * @param {SelectMenuInteraction} interaction - The select menu interaction
     */
    async handleSelectInteraction(interaction) {
        const selectId = interaction.customId;
        const selectedValues = interaction.values;
        
        Logger.debug(`Select interaction: ${selectId} with values: ${selectedValues.join(', ')}`, 'InteractionHandler');
        
        // Example select handlers (can be expanded)
        switch (selectId) {
            case 'help_category':
                await this.handleHelpCategorySelect(interaction, selectedValues[0]);
                break;
            default:
                Logger.debug(`Unhandled select: ${selectId}`, 'InteractionHandler');
                await interaction.reply({ content: 'This select menu is not implemented yet.', ephemeral: true });
        }
    }

    /**
     * Handle text input interactions
     * @param {TextInputInteraction} interaction - The text input interaction
     */
    async handleTextInputInteraction(interaction) {
        const inputId = interaction.customId;
        const value = interaction.value;
        
        Logger.debug(`Text input interaction: ${inputId} with value: ${value}`, 'InteractionHandler');
        
        // Handle text input (can be expanded)
        await interaction.reply({ content: 'Text input received but not implemented yet.', ephemeral: true });
    }

    /**
     * Handle autocomplete interactions
     * @param {AutocompleteInteraction} interaction - The autocomplete interaction
     */
    async handleAutocompleteInteraction(interaction) {
        const commandName = interaction.commandName;
        const focusedOption = interaction.options.getFocused(true);
        
        Logger.debug(`Autocomplete for ${commandName}: ${focusedOption.name}`, 'InteractionHandler');
        
        // Handle autocomplete (can be expanded)
        await interaction.respond([]);
    }

    /**
     * Handle modal submit interactions
     * @param {ModalSubmitInteraction} interaction - The modal submit interaction
     */
    async handleModalInteraction(interaction) {
        const modalId = interaction.customId;
        
        Logger.debug(`Modal submit: ${modalId}`, 'InteractionHandler');
        
        // Handle modal submit (can be expanded)
        await interaction.reply({ content: 'Modal submitted but not implemented yet.', ephemeral: true });
    }

    /**
     * Check if user has permissions to use the command
     * @param {CommandInteraction} interaction - The interaction
     * @param {Object} command - The command object
     * @returns {boolean} Whether user has permissions
     */
    async checkPermissions(interaction, command) {
        // Check if command requires specific permissions
        if (command.permissions) {
            const member = interaction.member;
            if (!member) {
                await this.replyWithError(interaction, 'This command can only be used in a server.');
                return false;
            }

            for (const permission of command.permissions) {
                if (!member.permissions.has(permission)) {
                    await this.replyWithError(interaction, `You need the \`${permission}\` permission to use this command.`);
                    return false;
                }
            }
        }

        // Check if command is owner-only
        if (command.ownerOnly) {
            const config = require('../../config/config');
            if (!config.ownerIds.includes(interaction.user.id)) {
                await this.replyWithError(interaction, 'This command is only available to bot owners.');
                return false;
            }
        }

        return true;
    }

    /**
     * Check command cooldown
     * @param {CommandInteraction} interaction - The interaction
     * @param {Object} command - The command object
     * @returns {boolean} Whether cooldown check passed
     */
    async checkCooldown(interaction, command) {
        const cooldownAmount = command.cooldown || 3; // Default 3 seconds
        const userId = interaction.user.id;
        const commandName = command.data.name;

        if (!this.cooldowns.has(commandName)) {
            this.cooldowns.set(commandName, new Map());
        }

        const now = Date.now();
        const timestamps = this.cooldowns.get(commandName);
        const lastUsage = timestamps.get(userId);

        if (lastUsage && (now - lastUsage) < cooldownAmount * 1000) {
            const timeLeft = Math.ceil((cooldownAmount * 1000 - (now - lastUsage)) / 1000);
            await this.replyWithError(interaction, `Please wait ${timeLeft} more second(s) before using this command again.`);
            return false;
        }

        timestamps.set(userId, now);
        setTimeout(() => timestamps.delete(userId), cooldownAmount * 1000);

        return true;
    }

    /**
     * Update user statistics in database using an upsert operation
     * @param {CommandInteraction} interaction - The interaction object
     */
    async updateUserStats(interaction) {
        try {
            const User = require('../database/models/user');
            const user = interaction.user;
            const commandName = interaction.commandName;

            const query = { discordId: user.id };
            const update = {
                $set: {
                    username: user.username,
                    discriminator: user.discriminator,
                    avatar: user.avatar,
                    lastSeen: new Date(),
                },
                $inc: {
                    'commandStats.totalCommands': 1,
                    [`commandStats.commandsUsed.${commandName}`]: 1
                },
                $setOnInsert: {
                    userId: user.id, // Only set on creation
                    joinDate: new Date()
                }
            };
            const options = {
                upsert: true, // Create if doesn't exist
                new: true, // Return the updated document
                setDefaultsOnInsert: true // Apply schema defaults on creation
            };

            await User.findOneAndUpdate(query, update, options);

        } catch (error) {
            // Log the error but don't let it crash the command execution
            Logger.error(`Error updating user stats: ${error.message}`, 'InteractionHandler');
            if (error.code === 11000) {
                Logger.warn(`A duplicate key error occurred during upsert for user ${user.id}. This should not happen.`, 'InteractionHandler');
            }
        }
    }

    /**
     * Reply with error message
     * @param {Interaction} interaction - The interaction
     * @param {string} message - Error message
     */
    async replyWithError(interaction, message) {
        try {
            const embed = EmbedBuilderUtil.error('Error', message);
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            Logger.error(`Error sending error message: ${error.message}`, 'InteractionHandler');
        }
    }

    /**
     * Handle interaction errors
     * @param {Interaction} interaction - The interaction
     * @param {Error} error - The error
     */
    async handleInteractionError(interaction, error) {
        try {
            const embed = EmbedBuilderUtil.error(
                'Interaction Error',
                'An error occurred while processing your request.'
            );
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (replyError) {
            Logger.error(`Failed to send error message: ${replyError.message}`, 'InteractionHandler');
        }
    }

    /**
     * Handle help category select
     * @param {SelectMenuInteraction} interaction - The interaction
     * @param {string} category - Selected category
     */
    async handleHelpCategorySelect(interaction, category) {
        const commands = this.client.commandHandler.getCommandsByCategory(category);
        
        if (commands.size === 0) {
            await interaction.update({ content: 'No commands found in this category.', embeds: [], components: [] });
            return;
        }

        const embed = EmbedBuilderUtil.info(
            `Commands - ${category}`,
            `Here are the commands in the ${category} category:`
        );

        const commandList = commands.map(cmd => 
            `\`/${cmd.data.name}\` - ${cmd.data.description}`
        ).join('\n');

        embed.addFields({
            name: 'Commands',
            value: commandList,
            inline: false
        });

        await interaction.update({ embeds: [embed] });
    }
}

module.exports = InteractionHandler;
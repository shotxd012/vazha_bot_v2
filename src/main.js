const { Client, GatewayIntentBits, Collection } = require('discord.js');
const path = require('path');

// Import utilities and handlers
const Logger = require('./utils/logger');
const ErrorHandler = require('./utils/errorHandler');
const DatabaseConnection = require('./database/connect');
const CommandHandler = require('./handlers/commandHandler');
const EventHandler = require('./handlers/eventHandler');
const InteractionHandler = require('./handlers/interactionHandler');

// Import configuration
const config = require('../config/config');
const WelcomeSettings = require('./database/models/welcome'); // Import the model

/**
 * Main Discord Bot Class
 */
class VazhaBot {
    constructor() {
        // Create Discord client with necessary intents
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent
            ]
        });

        // Initialize handlers
        this.client.commandHandler = new CommandHandler(this.client);
        this.client.eventHandler = new EventHandler(this.client);
        this.client.interactionHandler = new InteractionHandler(this.client);

        // Initialize collections
        this.client.commands = new Collection();
        this.client.events = new Collection();
        this.client.welcomeSettings = new Collection();
    }

    /**
     * Load welcome settings from the database
     */
    async loadWelcomeSettings() {
        try {
            const settings = await WelcomeSettings.find();
            settings.forEach(setting => {
                this.client.welcomeSettings.set(setting.guildId, setting);
            });
            Logger.info(`Loaded welcome settings for ${this.client.welcomeSettings.size} guilds.`, 'Main');
        } catch (error) {
            Logger.error(`Failed to load welcome settings: ${error.message}`, 'Main');
        }
    }

    /**
     * Initialize the bot
     */
    async initialize() {
        try {
            Logger.startup('Vazha Bot', '1.0.0');

            // Initialize error handlers
            ErrorHandler.initialize();

            // Connect to database
            await DatabaseConnection.connect();

            // Load welcome settings
            await this.loadWelcomeSettings();

            // Load commands and events
            await this.client.commandHandler.loadCommands();
            await this.client.eventHandler.loadEvents();

            // Login to Discord
            await this.client.login(config.token);

            Logger.success('Bot initialization completed', 'Main');

        } catch (error) {
            Logger.error(`Failed to initialize bot: ${error.message}`, 'Main');
            Logger.debug(`Stack: ${error.stack}`, 'Main');
            process.exit(1);
        }
    }

    /**
     * Register slash commands with Discord
     */
    async registerCommands() {
        try {
            const { REST, Routes } = require('discord.js');
            const rest = new REST({ version: '10' }).setToken(config.token);

            const commands = this.client.commandHandler.getCommandsForRegistration();
            
            Logger.info(`Started refreshing ${commands.length} application (/) commands.`, 'Main');

            // First, get existing commands to delete them
            let existingCommands = [];
            try {
                existingCommands = await rest.get(Routes.applicationCommands(config.clientId));
                Logger.debug(`Found ${existingCommands.length} existing commands to remove`, 'Main');
            } catch (error) {
                Logger.warn(`Could not fetch existing commands: ${error.message}`, 'Main');
            }

            // Delete all existing commands (except Entry Point commands)
            for (const existingCommand of existingCommands) {
                if (existingCommand.type !== 1) { // Skip Entry Point commands
                    try {
                        await rest.delete(
                            Routes.applicationCommand(config.clientId, existingCommand.id)
                        );
                        Logger.debug(`Deleted existing command: ${existingCommand.name}`, 'Main');
                    } catch (error) {
                        Logger.warn(`Failed to delete command ${existingCommand.name}: ${error.message}`, 'Main');
                    }
                } else {
                    Logger.debug(`Skipping Entry Point command: ${existingCommand.name}`, 'Main');
                }
            }

            // Filter out any Entry Point commands from our new commands
            const commandsToRegister = commands.filter(cmd => {
                if (cmd.type === 1) {
                    Logger.warn(`Skipping Entry Point command: ${cmd.name}`, 'Main');
                    return false;
                }
                return true;
            });

            if (commandsToRegister.length === 0) {
                Logger.warn('No commands to register after filtering', 'Main');
                return;
            }

            // Register commands globally
            const data = await rest.put(
                Routes.applicationCommands(config.clientId),
                { body: commandsToRegister }
            );

            Logger.success(`Successfully reloaded ${data.length} application (/) commands.`, 'Main');

        } catch (error) {
            Logger.error(`Error registering commands: ${error.message}`, 'Main');
            Logger.debug(`Stack: ${error.stack}`, 'Main');
        }
    }

    /**
     * Start the bot
     */
    async start() {
        try {
            await this.initialize();
            
            // Register commands after bot is ready
            this.client.once('ready', async () => {
                await this.registerCommands();
            });

        } catch (error) {
            Logger.error(`Failed to start bot: ${error.message}`, 'Main');
            Logger.debug(`Stack: ${error.stack}`, 'Main');
            process.exit(1);
        }
    }

    /**
     * Gracefully shutdown the bot
     */
    async shutdown() {
        try {
            Logger.info('Shutting down bot...', 'Main');
            
            // Disconnect from database
            await DatabaseConnection.disconnect();
            
            // Destroy Discord client
            if (this.client) {
                this.client.destroy();
            }
            
            Logger.success('Bot shutdown completed', 'Main');
            process.exit(0);
            
        } catch (error) {
            Logger.error(`Error during shutdown: ${error.message}`, 'Main');
            process.exit(1);
        }
    }
}

// Create and start the bot
const bot = new VazhaBot();

// Handle process termination
process.on('SIGINT', async () => {
    Logger.info('Received SIGINT, shutting down...', 'Main');
    await bot.shutdown();
});

process.on('SIGTERM', async () => {
    Logger.info('Received SIGTERM, shutting down...', 'Main');
    await bot.shutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    Logger.error(`Uncaught Exception: ${error.message}`, 'Main');
    Logger.debug(`Stack: ${error.stack}`, 'Main');
    process.exit(1);
});

// Start the bot
bot.start().catch(error => {
    Logger.error(`Failed to start bot: ${error.message}`, 'Main');
    Logger.debug(`Stack: ${error.stack}`, 'Main');
    process.exit(1);
}); 
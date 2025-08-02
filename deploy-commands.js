const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config =require('./config/config');
const Logger = require('./src/utils/logger');

/**
 * Deploys slash commands to Discord.
 * This script reads all command files and syncs them with Discord,
 * adding, updating, and removing commands as necessary.
 */
async function deployCommands() {
    try {
        Logger.info('Starting command deployment...', 'Deploy');

        const commands = [];
        const commandsPath = path.join(__dirname, 'src/commands');

        if (!fs.existsSync(commandsPath)) {
            Logger.error('Commands directory not found!', 'Deploy');
            return;
        }

        // --- Load Command Files Recursively ---
        const commandFolders = fs.readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const commandsPathFolder = path.join(commandsPath, folder);
            const commandFiles = fs.readdirSync(commandsPathFolder).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPathFolder, file);
                try {
                    const command = require(filePath);
                    if ('data' in command && 'execute' in command) {
                        commands.push(command.data.toJSON());
                        Logger.debug(`Loaded command: /${command.data.name}`, 'Deploy');
                    } else {
                        Logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`, 'Deploy');
                    }
                } catch (error) {
                    Logger.error(`Error loading command file ${file}: ${error.message}`, 'Deploy');
                }
            }
        }

        if (commands.length === 0) {
            Logger.warn('No valid command files found to deploy.', 'Deploy');
            return;
        }

        // --- Register Commands with Discord ---
        const rest = new REST({ version: '10' }).setToken(config.token);

        Logger.info(`Started refreshing ${commands.length} application (/) commands globally.`, 'Deploy');

        // The 'put' method is used to fully refresh all commands with the current set.
        // It's the recommended way to keep commands in sync.
        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands },
        );

        Logger.success(`Successfully reloaded ${data.length} application (/) commands.`, 'Deploy');

    } catch (error) {
        Logger.error('Failed to deploy commands:', 'Deploy');
        Logger.error(error.message); // Log the actual error message
        process.exit(1);
    }
}

// Run deployment if this file is executed directly
if (require.main === module) {
    deployCommands();
}

module.exports = { deployCommands };

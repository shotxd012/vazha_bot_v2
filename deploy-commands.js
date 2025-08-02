const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');

/**
 * Deploy slash commands to Discord
 */
async function deployCommands() {
    try {
        console.log('Starting command deployment...');

        // Load commands from the commands directory
        const commands = [];
        const commandsPath = path.join(__dirname, 'src/commands');
        
        if (!fs.existsSync(commandsPath)) {
            console.error('Commands directory not found!');
            return;
        }

        // Recursively load commands
        function loadCommandsFromDirectory(dirPath, category = '') {
            const items = fs.readdirSync(dirPath);

            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stat = fs.statSync(itemPath);

                if (stat.isDirectory()) {
                    // This is a category directory
                    const newCategory = category ? `${category}/${item}` : item;
                    loadCommandsFromDirectory(itemPath, newCategory);
                } else if (item.endsWith('.js')) {
                    // This is a command file
                    try {
                        const command = require(itemPath);
                        
                        if (command.data && command.data.name) {
                            commands.push(command.data.toJSON());
                            console.log(`Loaded command: ${command.data.name} (${category})`);
                        }
                    } catch (error) {
                        console.error(`Error loading command ${itemPath}: ${error.message}`);
                    }
                }
            }
        }

        loadCommandsFromDirectory(commandsPath);

        if (commands.length === 0) {
            console.error('No commands found to deploy!');
            return;
        }

        // Create REST instance
        const rest = new REST({ version: '10' }).setToken(config.token);

        // First, get existing commands to delete them
        let existingCommands = [];
        try {
            existingCommands = await rest.get(Routes.applicationCommands(config.clientId));
            console.log(`Found ${existingCommands.length} existing commands to remove`);
        } catch (error) {
            console.warn(`Could not fetch existing commands: ${error.message}`);
        }

        // Delete all existing commands (except Entry Point commands)
        for (const existingCommand of existingCommands) {
            if (existingCommand.type !== 1) { // Skip Entry Point commands
                try {
                    await rest.delete(
                        Routes.applicationCommand(config.clientId, existingCommand.id)
                    );
                    console.log(`Deleted existing command: ${existingCommand.name}`);
                } catch (error) {
                    console.warn(`Failed to delete command ${existingCommand.name}: ${error.message}`);
                }
            } else {
                console.log(`Skipping Entry Point command: ${existingCommand.name}`);
            }
        }

        // Filter out any Entry Point commands from our new commands
        const commandsToRegister = commands.filter(cmd => {
            if (cmd.type === 1) {
                console.warn(`Skipping Entry Point command: ${cmd.name}`);
                return false;
            }
            return true;
        });

        if (commandsToRegister.length === 0) {
            console.warn('No commands to register after filtering');
            return;
        }

        console.log(`Started registering ${commandsToRegister.length} new application (/) commands.`);

        // Register our new commands globally
        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commandsToRegister }
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        console.log('Command deployment completed!');

    } catch (error) {
        console.error('Error deploying commands:', error);
        process.exit(1);
    }
}

// Run deployment if this file is executed directly
if (require.main === module) {
    deployCommands();
}

module.exports = { deployCommands }; 
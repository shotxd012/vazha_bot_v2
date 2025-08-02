const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const Logger = require('../utils/logger');

/**
 * Command Handler for loading and managing slash commands
 */
class CommandHandler {
    constructor(client) {
        this.client = client;
        this.commands = new Collection();
        this.commandCategories = new Collection();
    }

    /**
     * Load all commands from the commands directory
     */
    async loadCommands() {
        const commandsPath = path.join(__dirname, '../commands');
        
        try {
            // Check if commands directory exists
            if (!fs.existsSync(commandsPath)) {
                Logger.warn('Commands directory not found, creating...', 'CommandHandler');
                fs.mkdirSync(commandsPath, { recursive: true });
                return;
            }

            // Load commands from all subdirectories
            await this.loadCommandsFromDirectory(commandsPath);
            
            Logger.success(`Loaded ${this.commands.size} commands`, 'CommandHandler');
            Logger.debug(`Command categories: ${Array.from(this.commandCategories.keys()).join(', ')}`, 'CommandHandler');
            
        } catch (error) {
            Logger.error(`Error loading commands: ${error.message}`, 'CommandHandler');
            Logger.debug(`Stack: ${error.stack}`, 'CommandHandler');
        }
    }

    /**
     * Recursively load commands from a directory
     * @param {string} dirPath - Directory path to load from
     * @param {string} category - Current category name
     */
    async loadCommandsFromDirectory(dirPath, category = '') {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                // This is a category directory
                const newCategory = category ? `${category}/${item}` : item;
                await this.loadCommandsFromDirectory(itemPath, newCategory);
            } else if (item.endsWith('.js')) {
                // This is a command file
                await this.loadCommand(itemPath, category);
            }
        }
    }

    /**
     * Load a single command file
     * @param {string} filePath - Path to the command file
     * @param {string} category - Command category
     */
    async loadCommand(filePath, category = '') {
        try {
            // Delete require cache to allow hot reloading
            delete require.cache[require.resolve(filePath)];
            
            const command = require(filePath);
            
            // Validate command structure
            if (!this.validateCommand(command)) {
                Logger.warn(`Invalid command structure in ${filePath}`, 'CommandHandler');
                return;
            }

            // Add category to command
            command.category = category;
            
            // Add command to collections
            this.commands.set(command.data.name, command);
            
            if (!this.commandCategories.has(category)) {
                this.commandCategories.set(category, new Collection());
            }
            this.commandCategories.get(category).set(command.data.name, command);
            
            Logger.debug(`Loaded command: ${command.data.name} (${category})`, 'CommandHandler');
            
        } catch (error) {
            Logger.error(`Error loading command ${filePath}: ${error.message}`, 'CommandHandler');
            Logger.debug(`Stack: ${error.stack}`, 'CommandHandler');
        }
    }

    /**
     * Validate command structure
     * @param {Object} command - Command object to validate
     * @returns {boolean} Whether the command is valid
     */
    validateCommand(command) {
        const requiredProperties = ['data', 'execute'];
        
        for (const prop of requiredProperties) {
            if (!command.hasOwnProperty(prop)) {
                Logger.warn(`Command missing required property: ${prop}`, 'CommandHandler');
                return false;
            }
        }

        // Validate data structure
        if (!command.data.name || !command.data.description) {
            Logger.warn('Command data missing name or description', 'CommandHandler');
            return false;
        }

        return true;
    }

    /**
     * Get all commands for registration
     * @returns {Array} Array of command data objects
     */
    getCommandsForRegistration() {
        return Array.from(this.commands.values()).map(cmd => cmd.data);
    }

    /**
     * Get command by name
     * @param {string} name - Command name
     * @returns {Object|null} Command object or null
     */
    getCommand(name) {
        return this.commands.get(name) || null;
    }

    /**
     * Get commands by category
     * @param {string} category - Category name
     * @returns {Collection} Collection of commands in category
     */
    getCommandsByCategory(category) {
        return this.commandCategories.get(category) || new Collection();
    }

    /**
     * Get all categories
     * @returns {Array} Array of category names
     */
    getCategories() {
        return Array.from(this.commandCategories.keys());
    }

    /**
     * Reload a specific command
     * @param {string} commandName - Name of command to reload
     * @returns {boolean} Whether reload was successful
     */
    async reloadCommand(commandName) {
        const command = this.commands.get(commandName);
        if (!command) {
            Logger.warn(`Command ${commandName} not found for reload`, 'CommandHandler');
            return false;
        }

        try {
            // Find the file path (this is a simplified approach)
            const commandsPath = path.join(__dirname, '../commands');
            const commandFile = this.findCommandFile(commandsPath, commandName);
            
            if (commandFile) {
                await this.loadCommand(commandFile, command.category);
                Logger.success(`Reloaded command: ${commandName}`, 'CommandHandler');
                return true;
            }
            
            return false;
        } catch (error) {
            Logger.error(`Error reloading command ${commandName}: ${error.message}`, 'CommandHandler');
            return false;
        }
    }

    /**
     * Find command file by name
     * @param {string} dirPath - Directory to search
     * @param {string} commandName - Command name to find
     * @returns {string|null} File path or null
     */
    findCommandFile(dirPath, commandName) {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                const found = this.findCommandFile(itemPath, commandName);
                if (found) return found;
            } else if (item.endsWith('.js')) {
                try {
                    const command = require(itemPath);
                    if (command.data && command.data.name === commandName) {
                        return itemPath;
                    }
                } catch (error) {
                    // Ignore errors when searching
                }
            }
        }

        return null;
    }

    /**
     * Get command statistics
     * @returns {Object} Command statistics
     */
    getStats() {
        const stats = {
            totalCommands: this.commands.size,
            categories: this.commandCategories.size,
            commandsByCategory: {}
        };

        for (const [category, commands] of this.commandCategories) {
            stats.commandsByCategory[category] = commands.size;
        }

        return stats;
    }
}

module.exports = CommandHandler; 
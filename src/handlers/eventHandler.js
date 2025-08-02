const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

/**
 * Event Handler for loading and managing Discord.js events
 */
class EventHandler {
    constructor(client) {
        this.client = client;
        this.events = new Map();
    }

    /**
     * Load all events from the events directory
     */
    async loadEvents() {
        const eventsPath = path.join(__dirname, '../events');
        
        try {
            // Check if events directory exists
            if (!fs.existsSync(eventsPath)) {
                Logger.warn('Events directory not found, creating...', 'EventHandler');
                fs.mkdirSync(eventsPath, { recursive: true });
                return;
            }

            // Load events from all subdirectories
            await this.loadEventsFromDirectory(eventsPath);
            
            Logger.success(`Loaded ${this.events.size} events`, 'EventHandler');
            
        } catch (error) {
            Logger.error(`Error loading events: ${error.message}`, 'EventHandler');
            Logger.debug(`Stack: ${error.stack}`, 'EventHandler');
        }
    }

    /**
     * Recursively load events from a directory
     * @param {string} dirPath - Directory path to load from
     * @param {string} category - Current category name
     */
    async loadEventsFromDirectory(dirPath, category = '') {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                // This is a category directory
                const newCategory = category ? `${category}/${item}` : item;
                await this.loadEventsFromDirectory(itemPath, newCategory);
            } else if (item.endsWith('.js')) {
                // This is an event file
                await this.loadEvent(itemPath, category);
            }
        }
    }

    /**
     * Load a single event file
     * @param {string} filePath - Path to the event file
     * @param {string} category - Event category
     */
    async loadEvent(filePath, category = '') {
        try {
            // Delete require cache to allow hot reloading
            delete require.cache[require.resolve(filePath)];
            
            const event = require(filePath);
            
            // Validate event structure
            if (!this.validateEvent(event)) {
                Logger.warn(`Invalid event structure in ${filePath}`, 'EventHandler');
                return;
            }

            // Add category to event
            event.category = category;
            
            // Register the event
            await this.registerEvent(event);
            
            Logger.debug(`Loaded event: ${event.name} (${category})`, 'EventHandler');
            
        } catch (error) {
            Logger.error(`Error loading event ${filePath}: ${error.message}`, 'EventHandler');
            Logger.debug(`Stack: ${error.stack}`, 'EventHandler');
        }
    }

    /**
     * Validate event structure
     * @param {Object} event - Event object to validate
     * @returns {boolean} Whether the event is valid
     */
    validateEvent(event) {
        const requiredProperties = ['name', 'execute'];
        
        for (const prop of requiredProperties) {
            if (!event.hasOwnProperty(prop)) {
                Logger.warn(`Event missing required property: ${prop}`, 'EventHandler');
                return false;
            }
        }

        return true;
    }

    /**
     * Register an event with the Discord.js client
     * @param {Object} event - Event object to register
     */
    async registerEvent(event) {
        try {
            // Remove existing event listener if it exists
            if (this.events.has(event.name)) {
                const existingEvent = this.events.get(event.name);
                this.client.removeListener(event.name, existingEvent.execute);
            }

            // Add the event to our tracking
            this.events.set(event.name, event);
            
            // Register with Discord.js client
            if (event.once) {
                this.client.once(event.name, (...args) => event.execute(...args));
            } else {
                this.client.on(event.name, (...args) => event.execute(...args));
            }
            
        } catch (error) {
            Logger.error(`Error registering event ${event.name}: ${error.message}`, 'EventHandler');
            Logger.debug(`Stack: ${error.stack}`, 'EventHandler');
        }
    }

    /**
     * Get event by name
     * @param {string} name - Event name
     * @returns {Object|null} Event object or null
     */
    getEvent(name) {
        return this.events.get(name) || null;
    }

    /**
     * Get events by category
     * @param {string} category - Category name
     * @returns {Array} Array of events in category
     */
    getEventsByCategory(category) {
        const events = [];
        for (const [name, event] of this.events) {
            if (event.category === category) {
                events.push(event);
            }
        }
        return events;
    }

    /**
     * Get all categories
     * @returns {Array} Array of category names
     */
    getCategories() {
        const categories = new Set();
        for (const event of this.events.values()) {
            if (event.category) {
                categories.add(event.category);
            }
        }
        return Array.from(categories);
    }

    /**
     * Reload a specific event
     * @param {string} eventName - Name of event to reload
     * @returns {boolean} Whether reload was successful
     */
    async reloadEvent(eventName) {
        const event = this.events.get(eventName);
        if (!event) {
            Logger.warn(`Event ${eventName} not found for reload`, 'EventHandler');
            return false;
        }

        try {
            // Find the file path
            const eventsPath = path.join(__dirname, '../events');
            const eventFile = this.findEventFile(eventsPath, eventName);
            
            if (eventFile) {
                await this.loadEvent(eventFile, event.category);
                Logger.success(`Reloaded event: ${eventName}`, 'EventHandler');
                return true;
            }
            
            return false;
        } catch (error) {
            Logger.error(`Error reloading event ${eventName}: ${error.message}`, 'EventHandler');
            return false;
        }
    }

    /**
     * Find event file by name
     * @param {string} dirPath - Directory to search
     * @param {string} eventName - Event name to find
     * @returns {string|null} File path or null
     */
    findEventFile(dirPath, eventName) {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                const found = this.findEventFile(itemPath, eventName);
                if (found) return found;
            } else if (item.endsWith('.js')) {
                try {
                    const event = require(itemPath);
                    if (event.name === eventName) {
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
     * Get event statistics
     * @returns {Object} Event statistics
     */
    getStats() {
        const stats = {
            totalEvents: this.events.size,
            categories: this.getCategories().length,
            eventsByCategory: {}
        };

        for (const category of this.getCategories()) {
            stats.eventsByCategory[category] = this.getEventsByCategory(category).length;
        }

        return stats;
    }

    /**
     * Remove all event listeners
     */
    removeAllEvents() {
        for (const [name, event] of this.events) {
            this.client.removeAllListeners(name);
        }
        this.events.clear();
        Logger.info('Removed all event listeners', 'EventHandler');
    }
}

module.exports = EventHandler; 
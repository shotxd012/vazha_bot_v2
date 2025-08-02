const mongoose = require('mongoose');
const Logger = require('../utils/logger');
const config = require('../../config/config');

/**
 * Database connection utility
 */
class DatabaseConnection {
    /**
     * Connect to MongoDB
     * @returns {Promise<void>}
     */
    static async connect() {
        try {
            await mongoose.connect(config.mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });

            Logger.success('Connected to MongoDB successfully', 'Database');
            
            // Log connection info
            const db = mongoose.connection;
            Logger.info(`Database: ${db.name}`, 'Database');
            Logger.info(`Host: ${db.host}:${db.port}`, 'Database');
            
        } catch (error) {
            Logger.error(`Failed to connect to MongoDB: ${error.message}`, 'Database');
            Logger.debug(`Stack: ${error.stack}`, 'Database');
            process.exit(1);
        }
    }

    /**
     * Disconnect from MongoDB
     * @returns {Promise<void>}
     */
    static async disconnect() {
        try {
            await mongoose.disconnect();
            Logger.info('Disconnected from MongoDB', 'Database');
        } catch (error) {
            Logger.error(`Error disconnecting from MongoDB: ${error.message}`, 'Database');
        }
    }

    /**
     * Get connection status
     * @returns {string} Connection status
     */
    static getStatus() {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        return states[mongoose.connection.readyState];
    }

    /**
     * Check if connected
     * @returns {boolean} Connection status
     */
    static isConnected() {
        return mongoose.connection.readyState === 1;
    }
}

// Handle connection events
mongoose.connection.on('connected', () => {
    Logger.info('MongoDB connection established', 'Database');
});

mongoose.connection.on('error', (error) => {
    Logger.error(`MongoDB connection error: ${error.message}`, 'Database');
});

mongoose.connection.on('disconnected', () => {
    Logger.warn('MongoDB connection disconnected', 'Database');
});

// Handle process termination
process.on('SIGINT', async () => {
    Logger.info('Received SIGINT, closing database connection...', 'Database');
    await DatabaseConnection.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    Logger.info('Received SIGTERM, closing database connection...', 'Database');
    await DatabaseConnection.disconnect();
    process.exit(0);
});

module.exports = DatabaseConnection; 
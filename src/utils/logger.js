const chalk = require('chalk');

/**
 * Custom logger utility for styled terminal outputs
 */
class Logger {
    /**
     * Get current timestamp
     * @returns {string} Formatted timestamp
     */
    static getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Log info message
     * @param {string} message - Message to log
     * @param {string} source - Source of the log (optional)
     */
    static info(message, source = '') {
        const timestamp = this.getTimestamp();
        const sourceText = source ? ` [${source}]` : '';
        console.log(`${chalk.blue('INFO')} ${chalk.gray(timestamp)}${sourceText} ${message}`);
    }

    /**
     * Log warning message
     * @param {string} message - Message to log
     * @param {string} source - Source of the log (optional)
     */
    static warn(message, source = '') {
        const timestamp = this.getTimestamp();
        const sourceText = source ? ` [${source}]` : '';
        console.log(`${chalk.yellow('WARN')} ${chalk.gray(timestamp)}${sourceText} ${message}`);
    }

    /**
     * Log error message
     * @param {string} message - Message to log
     * @param {string} source - Source of the log (optional)
     */
    static error(message, source = '') {
        const timestamp = this.getTimestamp();
        const sourceText = source ? ` [${source}]` : '';
        console.log(`${chalk.red('ERROR')} ${chalk.gray(timestamp)}${sourceText} ${message}`);
    }

    /**
     * Log debug message (only in debug mode)
     * @param {string} message - Message to log
     * @param {string} source - Source of the log (optional)
     */
    static debug(message, source = '') {
        if (process.env.DEBUG_MODE === 'true') {
            const timestamp = this.getTimestamp();
            const sourceText = source ? ` [${source}]` : '';
            console.log(`${chalk.magenta('DEBUG')} ${chalk.gray(timestamp)}${sourceText} ${message}`);
        }
    }

    /**
     * Log success message
     * @param {string} message - Message to log
     * @param {string} source - Source of the log (optional)
     */
    static success(message, source = '') {
        const timestamp = this.getTimestamp();
        const sourceText = source ? ` [${source}]` : '';
        console.log(`${chalk.green('SUCCESS')} ${chalk.gray(timestamp)}${sourceText} ${message}`);
    }

    /**
     * Log bot startup message
     * @param {string} botName - Bot name
     * @param {string} version - Bot version
     */
    static startup(botName, version) {
        console.log('\n' + '='.repeat(50));
        console.log(chalk.cyan.bold(`${botName} v${version}`));
        console.log(chalk.gray('Starting up...'));
        console.log('='.repeat(50) + '\n');
    }

    /**
     * Log bot ready message
     * @param {string} botName - Bot name
     * @param {number} guildCount - Number of guilds
     */
    static ready(botName, guildCount) {
        console.log('\n' + '='.repeat(50));
        console.log(chalk.green.bold(`${botName} is now online!`));
        console.log(chalk.gray(`Serving ${guildCount} guilds`));
        console.log('='.repeat(50) + '\n');
    }
}

module.exports = Logger; 
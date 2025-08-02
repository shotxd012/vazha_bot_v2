const { EmbedBuilder } = require('discord.js');
const config = require('./config');

/**
 * Centralized embed configuration and utility functions
 */
class EmbedConfig {
    /**
     * Create a base embed with consistent styling
     * @param {Object} options - Embed options
     * @returns {EmbedBuilder} The styled embed
     */
    static createBaseEmbed(options = {}) {
        const embed = new EmbedBuilder()
            .setColor(options.color || config.colors.primary)
            .setTimestamp()
            .setFooter({ 
                text: 'Vazha Bot', 
                iconURL: options.footerIcon || 'https://cdn.discordapp.com/avatars/123456789/abcdef.png' 
            });

        if (options.title) embed.setTitle(options.title);
        if (options.description) embed.setDescription(options.description);
        if (options.thumbnail) embed.setThumbnail(options.thumbnail);
        if (options.image) embed.setImage(options.image);
        if (options.author) embed.setAuthor(options.author);

        return embed;
    }

    /**
     * Create a success embed
     * @param {string} title - Embed title
     * @param {string} description - Embed description
     * @returns {EmbedBuilder} Success embed
     */
    static success(title, description) {
        return this.createBaseEmbed({
            title: `✅ ${title}`,
            description,
            color: config.colors.success
        });
    }

    /**
     * Create an error embed
     * @param {string} title - Embed title
     * @param {string} description - Embed description
     * @returns {EmbedBuilder} Error embed
     */
    static error(title, description) {
        return this.createBaseEmbed({
            title: `❌ ${title}`,
            description,
            color: config.colors.error
        });
    }

    /**
     * Create a warning embed
     * @param {string} title - Embed title
     * @param {string} description - Embed description
     * @returns {EmbedBuilder} Warning embed
     */
    static warning(title, description) {
        return this.createBaseEmbed({
            title: `⚠️ ${title}`,
            description,
            color: config.colors.warning
        });
    }

    /**
     * Create an info embed
     * @param {string} title - Embed title
     * @param {string} description - Embed description
     * @returns {EmbedBuilder} Info embed
     */
    static info(title, description) {
        return this.createBaseEmbed({
            title: `ℹ️ ${title}`,
            description,
            color: config.colors.info
        });
    }

    /**
     * Create a help embed for commands
     * @param {string} commandName - Command name
     * @param {string} description - Command description
     * @param {Array} usage - Usage examples
     * @param {Array} examples - Command examples
     * @returns {EmbedBuilder} Help embed
     */
    static help(commandName, description, usage = [], examples = []) {
        const embed = this.createBaseEmbed({
            title: `Help: /${commandName}`,
            description,
            color: config.colors.secondary
        });

        if (usage.length > 0) {
            embed.addFields({
                name: 'Usage',
                value: usage.map(u => `\`${u}\``).join('\n'),
                inline: false
            });
        }

        if (examples.length > 0) {
            embed.addFields({
                name: 'Examples',
                value: examples.map(e => `\`${e}\``).join('\n'),
                inline: false
            });
        }

        return embed;
    }
}

module.exports = EmbedConfig; 
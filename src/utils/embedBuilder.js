const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

/**
 * Utility class for building styled embeds
 */
class EmbedBuilderUtil {
    /**
     * Create a base embed with consistent styling
     * @param {Object} options - Embed options
     * @returns {EmbedBuilder} The styled embed
     */
    static createEmbed(options = {}) {
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
        if (options.fields) embed.addFields(options.fields);

        return embed;
    }

    /**
     * Create a success embed
     * @param {string} title - Embed title
     * @param {string} description - Embed description
     * @param {Array} fields - Additional fields (optional)
     * @returns {EmbedBuilder} Success embed
     */
    static success(title, description, fields = []) {
        return this.createEmbed({
            title: title,
            description,
            color: config.colors.success,
            fields
        });
    }

    /**
     * Create an error embed
     * @param {string} title - Embed title
     * @param {string} description - Embed description
     * @param {Array} fields - Additional fields (optional)
     * @returns {EmbedBuilder} Error embed
     */
    static error(title, description, fields = []) {
        return this.createEmbed({
            title: title,
            description,
            color: config.colors.error,
            fields
        });
    }

    /**
     * Create a warning embed
     * @param {string} title - Embed title
     * @param {string} description - Embed description
     * @param {Array} fields - Additional fields (optional)
     * @returns {EmbedBuilder} Warning embed
     */
    static warning(title, description, fields = []) {
        return this.createEmbed({
            title: title,
            description,
            color: config.colors.warning,
            fields
        });
    }

    /**
     * Create an info embed
     * @param {string} title - Embed title
     * @param {string} description - Embed description
     * @param {Array} fields - Additional fields (optional)
     * @returns {EmbedBuilder} Info embed
     */
    static info(title, description, fields = []) {
        return this.createEmbed({
            title: title,
            description,
            color: config.colors.info,
            fields
        });
    }

    /**
     * Create a ping embed with latency information
     * @param {number} wsLatency - WebSocket latency
     * @param {number} apiLatency - API latency
     * @returns {EmbedBuilder} Ping embed
     */
    static ping(wsLatency, apiLatency) {
        const status = wsLatency < 100 ? 'Excellent' : 
                      wsLatency < 200 ? 'Good' : 
                      wsLatency < 400 ? 'Fair' : 'Poor';

        return this.createEmbed({
            title: 'Pong!',
            description: 'Here are the current latency statistics:',
            color: config.colors.secondary,
            fields: [
                {
                    name: 'WebSocket Latency',
                    value: `${wsLatency}ms`,
                    inline: true
                },
                {
                    name: 'API Latency',
                    value: `${apiLatency}ms`,
                    inline: true
                },
                {
                    name: 'Status',
                    value: status,
                    inline: true
                }
            ]
        });
    }

    /**
     * Create a help embed for commands
     * @param {string} commandName - Command name
     * @param {string} description - Command description
     * @param {Array} usage - Usage examples
     * @param {Array} examples - Command examples
     * @param {Array} permissions - Required permissions
     * @returns {EmbedBuilder} Help embed
     */
    static help(commandName, description, usage = [], examples = [], permissions = []) {
        const embed = this.createEmbed({
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

        if (permissions.length > 0) {
            embed.addFields({
                name: 'Required Permissions',
                value: permissions.join(', '),
                inline: false
            });
        }

        return embed;
    }

    /**
     * Create a moderation action embed
     * @param {string} action - Action performed (ban, kick, etc.)
     * @param {Object} user - User object
     * @param {string} reason - Reason for action
     * @param {Object} moderator - Moderator who performed action
     * @returns {EmbedBuilder} Moderation embed
     */
    static moderation(action, user, reason, moderator) {
        return this.createEmbed({
            title: `User ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            description: `**User:** ${user.tag} (${user.id})`,
            color: config.colors.error,
            fields: [
                {
                    name: 'Reason',
                    value: reason || 'No reason provided',
                    inline: false
                },
                {
                    name: 'Moderator',
                    value: moderator.tag,
                    inline: true
                },
                {
                    name: 'Timestamp',
                    value: new Date().toLocaleString(),
                    inline: true
                }
            ]
        });
    }
}

module.exports = EmbedBuilderUtil; 
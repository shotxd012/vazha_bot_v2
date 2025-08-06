const Logger = require('../../utils/logger');

module.exports = {
    name: 'guildUpdate',
    async execute(client, oldGuild, newGuild) {
        try {
            // Check if AFK channel was added
            if (!oldGuild.afkChannel && newGuild.afkChannel) {
                client.emit('guildAfkChannelAdd', newGuild, newGuild.afkChannel);
            }

            // Check for banner change
            if (oldGuild.banner !== newGuild.banner) {
                client.emit('guildBannerAdd', newGuild, newGuild.bannerURL({ dynamic: true, size: 4096 }));
            }

            // Check for boost level changes
            if (oldGuild.premiumTier < newGuild.premiumTier) {
                client.emit('guildBoostLevelUp', newGuild, oldGuild.premiumTier, newGuild.premiumTier);
            } else if (oldGuild.premiumTier > newGuild.premiumTier) {
                client.emit('guildBoostLevelDown', newGuild, oldGuild.premiumTier, newGuild.premiumTier);
            }

        } catch (error) {
            Logger.error(`Error in guildUpdate event: ${error.message}`, 'guildUpdate');
            Logger.debug(error.stack, 'guildUpdate');
        }
    }
};

const EmbedBuilderUtil = require('../../utils/embedBuilder');
const GuildLog = require('../../database/models/guildLog');
const Logger = require('../../utils/logger');

module.exports = {
    name: 'guildBannerAdd',
    async execute(client, guild, bannerURL) {
        try {
            const logsChannel = await client.getLogs(guild.id);
            if (!logsChannel) return;

            const embed = EmbedBuilderUtil.info(
                'Server Banner Updated',
                `The server's banner has been changed.`
            ).setImage(bannerURL);

            await logsChannel.send({ embeds: [embed] });

            const newLog = new GuildLog({
                guildId: guild.id,
                event: 'guildBannerAdd',
            });
            await newLog.save();

        } catch (error) {
            Logger.error(`Error in guildBannerAdd event: ${error.message}`, 'guildBannerAdd');
            Logger.debug(error.stack, 'guildBannerAdd');
        }
    }
};

const EmbedBuilderUtil = require('../../utils/embedBuilder');
const GuildLog = require('../../database/models/guildLog');
const Logger = require('../../utils/logger');

module.exports = {
    name: 'guildAfkChannelAdd',
    async execute(client, guild, afkChannel) {
        try {
            const logsChannel = await client.getLogs(guild.id);
            if (!logsChannel) return;

            const embed = EmbedBuilderUtil.info(
                'New AFK Channel Added',
                `An AFK channel has been set for the server.`,
                [
                    { name: 'Channel', value: `${afkChannel}` },
                    { name: 'Name', value: afkChannel.name },
                    { name: 'ID', value: afkChannel.id },
                    { name: 'Timestamp', value: `<t:${Math.floor(afkChannel.createdTimestamp / 1000)}:R>` }
                ]
            );

            await logsChannel.send({ embeds: [embed] });

            const newLog = new GuildLog({
                guildId: guild.id,
                event: 'guildAfkChannelAdd',
                targetId: afkChannel.id,
            });
            await newLog.save();

        } catch (error) {
            Logger.error(`Error in guildAfkChannelAdd event: ${error.message}`, 'guildAfkChannelAdd');
            Logger.debug(error.stack, 'guildAfkChannelAdd');
        }
    }
};

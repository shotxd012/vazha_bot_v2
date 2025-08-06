const EmbedBuilderUtil = require('../../utils/embedBuilder');
const GuildLog = require('../../database/models/guildLog');
const Logger = require('../../utils/logger');

module.exports = {
    name: 'guildBoostLevelDown',
    async execute(client, guild, oldLevel, newLevel) {
        try {
            const logsChannel = await client.getLogs(guild.id);
            if (!logsChannel) return;

            const embed = EmbedBuilderUtil.warning(
                'Boost Level Decreased',
                `The server's boost level has gone down.`,
                [
                    { name: 'Old Level', value: `Level ${oldLevel}` },
                    { name: 'New Level', value: `Level ${newLevel}` },
                    { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:R>` }
                ]
            );

            await logsChannel.send({ embeds: [embed] });

            const newLog = new GuildLog({
                guildId: guild.id,
                event: 'guildBoostLevelDown',
                changes: { oldLevel, newLevel }
            });
            await newLog.save();

        } catch (error) {
            Logger.error(`Error in guildBoostLevelDown event: ${error.message}`, 'guildBoostLevelDown');
            Logger.debug(error.stack, 'guildBoostLevelDown');
        }
    }
};

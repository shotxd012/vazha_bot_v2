const EmbedBuilderUtil = require('../../utils/embedBuilder');
const GuildLog = require('../../database/models/guildLog');
const Logger = require('../../utils/logger');

module.exports = {
    name: 'guildBanAdd',
    async execute(client, ban) {
        try {
            const logsChannel = await client.getLogs(ban.guild.id);
            if (!logsChannel) return;

            const embed = EmbedBuilderUtil.info(
                'Member Banned',
                `A user has been banned from the server.`,
                [
                    { name: 'User', value: `${ban.user}` },
                    { name: 'Tag', value: ban.user.tag },
                    { name: 'ID', value: ban.user.id },
                    { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:R>` }
                ]
            );

            await logsChannel.send({ embeds: [embed] });

            const newLog = new GuildLog({
                guildId: ban.guild.id,
                event: 'guildBanAdd',
                targetId: ban.user.id,
            });
            await newLog.save();

        } catch (error) {
            Logger.error(`Error in guildBanAdd event: ${error.message}`, 'guildBanAdd');
            Logger.debug(error.stack, 'guildBanAdd');
        }
    }
};

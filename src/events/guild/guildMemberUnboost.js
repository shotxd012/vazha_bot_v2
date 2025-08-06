const EmbedBuilderUtil = require('../../utils/embedBuilder');
const BoostChannel = require('../../database/models/boostChannels');
const BoostMessage = require('../../database/models/boostMessage');
const GuildLog = require('../../database/models/guildLog');
const Logger = require('../../utils/logger');

module.exports = {
    name: 'guildMemberUnboost',
    async execute(client, member) {
        try {
            const boostChannelData = await BoostChannel.findOne({ Guild: member.guild.id });
            if (!boostChannelData || !boostChannelData.Channel) return;

            const boostChannel = await client.channels.cache.get(boostChannelData.Channel);
            if (!boostChannel) return;

            const boostMessageData = await BoostMessage.findOne({ Guild: member.guild.id });
            let message = `${member} unboosted the server.`;

            if (boostMessageData && boostMessageData.unboostMessage) {
                const tier = { "TIER_1": "1", "TIER_2": "2", "TIER_3": "3", "NONE": "0" };
                message = boostMessageData.unboostMessage
                    .replace(/{user:username}/g, member.user.username)
                    .replace(/{user:discriminator}/g, member.user.discriminator)
                    .replace(/{user:tag}/g, member.user.tag)
                    .replace(/{user:mention}/g, member.toString())
                    .replace(/{guild:name}/g, member.guild.name)
                    .replace(/{guild:members}/g, member.guild.memberCount)
                    .replace(/{guild:boosts}/g, member.guild.premiumSubscriptionCount)
                    .replace(/{guild:booststier}/g, tier[member.guild.premiumTier]);
            }

            const embed = EmbedBuilderUtil.warning('Server Unboost', message);
            await boostChannel.send({ embeds: [embed] });

            const newLog = new GuildLog({
                guildId: member.guild.id,
                event: 'guildMemberUnboost',
                executorId: member.id,
                targetId: member.id,
            });
            await newLog.save();

        } catch (error) {
            Logger.error(`Error in guildMemberUnboost event: ${error.message}`, 'guildMemberUnboost');
            Logger.debug(error.stack, 'guildMemberUnboost');
        }
    }
};

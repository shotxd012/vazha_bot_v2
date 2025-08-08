const EmbedBuilderUtil = require('../../utils/embedBuilder');
const GuildLog = require('../../database/models/guildLog');
const Logger = require('../../utils/logger');

module.exports = {
    name: 'inviteCreate',
    async execute(client, invite) {
        try {
            // Add to invite cache
            const guildInvites = client.invites.get(invite.guild.id);
            if (guildInvites) {
                guildInvites.set(invite.code, invite.uses);
            }

            const logsChannel = await client.getLogs(invite.guild.id);
            if (!logsChannel) return;

            const embed = EmbedBuilderUtil.info(
                'Invite Created',
                'A new invite has been created.',
                [
                    { name: 'Code', value: `\`${invite.code}\`` },
                    { name: 'Inviter', value: `${invite.inviter} (${invite.inviter.tag})` },
                    { name: 'Timestamp', value: `<t:${Math.floor(invite.createdTimestamp / 1000)}:R>` }
                ]
            );

            await logsChannel.send({ embeds: [embed] });

            const newLog = new GuildLog({
                guildId: invite.guild.id,
                event: 'inviteCreate',
                executorId: invite.inviter.id,
                changes: { code: invite.code }
            });
            await newLog.save();

        } catch (error) {
            Logger.error(`Error in inviteCreate event: ${error.message}`, 'inviteCreate');
            Logger.error(error.stack, 'inviteCreate');
        }
    }
};

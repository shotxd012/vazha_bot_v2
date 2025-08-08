const EmbedBuilderUtil = require('../../utils/embedBuilder');
const GuildLog = require('../../database/models/guildLog');
const Logger = require('../../utils/logger');

module.exports = {
    name: 'inviteDelete',
    async execute(client, invite) {
        try {
            // Remove from invite cache
            const guildInvites = client.invites.get(invite.guild.id);
            if (guildInvites) {
                guildInvites.delete(invite.code);
            }

            const logsChannel = await client.getLogs(invite.guild.id);
            if (!logsChannel) return;

            const embed = EmbedBuilderUtil.warning(
                'Invite Deleted',
                'An invite has been deleted.',
                [
                    { name: 'Code', value: `\`${invite.code}\`` },
                    { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:R>` }
                ]
            );

            await logsChannel.send({ embeds: [embed] });

            const newLog = new GuildLog({
                guildId: invite.guild.id,
                event: 'inviteDelete',
                changes: { code: invite.code }
            });
            await newLog.save();

        } catch (error) {
            Logger.error(`Error in inviteDelete event: ${error.message}`, 'inviteDelete');
            Logger.debug(error.stack, 'inviteDelete');
        }
    }
};

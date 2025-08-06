const EmbedBuilderUtil = require('../../utils/embedBuilder');
const GuildLog = require('../../database/models/guildLog');
const Logger = require('../../utils/logger');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(client, oldMember, newMember) {
        try {
            // --- Boost/Unboost Detection ---
            const wasBoosting = !!oldMember.premiumSince;
            const isBoosting = !!newMember.premiumSince;

            if (!wasBoosting && isBoosting) {
                client.emit('guildMemberBoost', newMember);
            } else if (wasBoosting && !isBoosting) {
                client.emit('guildMemberUnboost', newMember);
            }

            // --- Role Change Detection ---
            const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
            const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));

            if (removedRoles.size > 0 || addedRoles.size > 0) {
                const logsChannel = await client.getLogs(newMember.guild.id);
                if (!logsChannel) return;

                const removedRolesString = removedRoles.size > 0 ? removedRoles.map(r => r.toString()).join(' ') : 'None';
                const addedRolesString = addedRoles.size > 0 ? addedRoles.map(r => r.toString()).join(' ') : 'None';

                const embed = EmbedBuilderUtil.info(
                    'Member Roles Updated',
                    `Roles for ${newMember.user.tag} have been changed.`,
                    [
                        { name: 'Added Roles', value: addedRolesString, inline: false },
                        { name: 'Removed Roles', value: removedRolesString, inline: false }
                    ]
                );
                
                await logsChannel.send({ embeds: [embed] });

                const newLog = new GuildLog({
                    guildId: newMember.guild.id,
                    event: 'guildMemberRoleUpdate',
                    executorId: 'UNKNOWN', // Difficult to determine without audit logs
                    targetId: newMember.id,
                    changes: {
                        added: addedRoles.map(r => ({ id: r.id, name: r.name })),
                        removed: removedRoles.map(r => ({ id: r.id, name: r.name }))
                    }
                });
                await newLog.save();
            }
        } catch (error) {
            Logger.error(`Error in guildMemberUpdate event: ${error.message}`, 'guildMemberUpdate');
            Logger.debug(error.stack, 'guildMemberUpdate');
        }
    }
};

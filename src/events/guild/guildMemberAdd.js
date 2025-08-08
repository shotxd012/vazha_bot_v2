const { EmbedBuilder } = require('discord.js');
const Welcome = require('../../database/models/welcome');
const Invites = require('../../database/models/invites');
const InvitedBy = require('../../database/models/invitedBy');
const InviteReward = require('../../database/models/inviteRewards');
const Logger = require('../../utils/logger');

// Helper function to replace placeholders
const replacePlaceholders = (text, member, inviter, inviteData) => {
    if (!text) return '';
    const tier = { "TIER_1": "1", "TIER_2": "2", "TIER_3": "3", "NONE": "0" };
    return text
        // User placeholders
        .replace(/{user}/g, member.toString()).replace(/{user:username}/g, member.user.username).replace(/{user:discriminator}/g, member.user.discriminator).replace(/{user:tag}/g, member.user.tag).replace(/{user:mention}/g, member.toString()).replace(/{user:id}/g, member.id).replace(/{user:avatar}/g, member.user.displayAvatarURL())
        // Guild placeholders
        .replace(/{server}/g, member.guild.name).replace(/{guild:name}/g, member.guild.name).replace(/{guild:id}/g, member.guild.id).replace(/{guild:members}/g, member.guild.memberCount).replace(/{guild:icon}/g, member.guild.iconURL()).replace(/{guild:boosts}/g, member.guild.premiumSubscriptionCount).replace(/{guild:booststier}/g, tier[member.guild.premiumTier])
        // Inviter placeholders
        .replace(/{inviter:username}/g, inviter ? inviter.username : 'System').replace(/{inviter:discriminator}/g, inviter ? inviter.discriminator : '#0000').replace(/{inviter:tag}/g, inviter ? inviter.tag : 'System#0000').replace(/{inviter:mention}/g, inviter ? inviter.toString() : 'System').replace(/{inviter:invites}/g, inviteData ? inviteData.Invites : '∞').replace(/{inviter:invites:left}/g, inviteData ? inviteData.Left : '∞');
};

module.exports = {
    name: 'guildMemberAdd',
    async execute(client, member) {
        try {
            // 1. Determine the inviter
            const { inviter } = await client.inviteHandler.onGuildMemberAdd(member);
            let inviteData;

            // 2. Update invite counts if an inviter is found
            if (inviter) {
                inviteData = await Invites.findOneAndUpdate(
                    { Guild: member.guild.id, User: inviter.id },
                    { $inc: { Invites: 1, Total: 1 } },
                    { upsert: true, new: true }
                );

                await InvitedBy.findOneAndUpdate(
                    { Guild: member.guild.id, User: member.id },
                    { inviteUser: inviter.id },
                    { upsert: true }
                );
            }

            // 3. Send welcome message using the main welcome config
            const welcomeDB = await Welcome.findOne({ guildId: member.guild.id });
            if (welcomeDB && welcomeDB.enabled && welcomeDB.channelId) {
                const channel = member.guild.channels.cache.get(welcomeDB.channelId);
                if (channel) {
                    if (welcomeDB.welcomeType === 'embed') {
                        const embedData = welcomeDB.embed;
                        const embed = new EmbedBuilder()
                            .setTitle(replacePlaceholders(embedData.title, member, inviter, inviteData))
                            .setDescription(replacePlaceholders(embedData.description, member, inviter, inviteData))
                            .setColor(embedData.color)
                            .setTimestamp();
                        if (embedData.footer && embedData.footer.text) {
                            embed.setFooter({ text: replacePlaceholders(embedData.footer.text, member, inviter, inviteData), iconURL: embedData.footer.iconURL });
                        }
                        if (embedData.thumbnail) {
                            embed.setThumbnail(member.user.displayAvatarURL());
                        }
                        if (embedData.image) {
                            embed.setImage(replacePlaceholders(embedData.image, member, inviter, inviteData));
                        }
                        if (embedData.fields && embedData.fields.length > 0) {
                            embed.addFields(embedData.fields.map(field => ({
                                name: replacePlaceholders(field.name, member, inviter, inviteData),
                                value: replacePlaceholders(field.value, member, inviter, inviteData),
                                inline: field.inline,
                            })));
                        }
                        await channel.send({ embeds: [embed] });
                    } else {
                        const message = replacePlaceholders(welcomeDB.message, member, inviter, inviteData);
                        await channel.send({ content: message, files: welcomeDB.imageUrl ? [welcomeDB.imageUrl] : [] });
                    }
                }
            }

            // 4. Check for and assign role rewards
            if (inviteData) {
                const rewardData = await InviteReward.findOne({ Guild: member.guild.id, Invites: inviteData.Invites });
                if (rewardData && rewardData.Role) {
                    const role = member.guild.roles.cache.get(rewardData.Role);
                    if (role) {
                        await member.roles.add(role);
                    }
                }
            }
            
            // 5. Assign a default role if configured
            if (welcomeDB && welcomeDB.roleEnabled && welcomeDB.roleId) {
                const role = member.guild.roles.cache.get(welcomeDB.roleId);
                if (role) {
                    await member.roles.add(role);
                }
            }

        } catch (error) {
            Logger.error(`Error in guildMemberAdd event: ${error.message}`, 'guildMemberAdd');
            Logger.debug(error.stack, 'guildMemberAdd');
        }
    },
};
const { EmbedBuilder } = require('discord.js');
const Welcome = require('../../database/models/welcome');

// Helper function to replace placeholders
const replacePlaceholders = (text, member) => {
    if (!text) return '';
    const tier = { "TIER_1": "1", "TIER_2": "2", "TIER_3": "3", "NONE": "0" };
    return text
        // User placeholders
        .replace(/{user}/g, member.toString())
        .replace(/{user:username}/g, member.user.username)
        .replace(/{user:discriminator}/g, member.user.discriminator)
        .replace(/{user:tag}/g, member.user.tag)
        .replace(/{user:mention}/g, member.toString())
        .replace(/{user:id}/g, member.id)
        .replace(/{user:avatar}/g, member.user.displayAvatarURL())
        // Guild placeholders
        .replace(/{server}/g, member.guild.name)
        .replace(/{guild:name}/g, member.guild.name)
        .replace(/{guild:id}/g, member.guild.id)
        .replace(/{guild:members}/g, member.guild.memberCount)
        .replace(/{guild:icon}/g, member.guild.iconURL())
        .replace(/{guild:boosts}/g, member.guild.premiumSubscriptionCount)
        .replace(/{guild:booststier}/g, tier[member.guild.premiumTier]);
};

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const welcomeDB = await Welcome.findOne({ guildId: member.guild.id });

        if (!welcomeDB || !welcomeDB.enabled || !welcomeDB.channelId) {
            return;
        }

        const channel = member.guild.channels.cache.get(welcomeDB.channelId);
        if (!channel) {
            return;
        }

        if (welcomeDB.welcomeType === 'embed') {
            const embedData = welcomeDB.embed;
            const embed = new EmbedBuilder()
                .setTitle(replacePlaceholders(embedData.title, member))
                .setDescription(replacePlaceholders(embedData.description, member))
                .setColor(embedData.color)
                .setTimestamp();

            if (embedData.footer && embedData.footer.text) {
                embed.setFooter({ 
                    text: replacePlaceholders(embedData.footer.text, member), 
                    iconURL: embedData.footer.iconURL 
                });
            }

            if (embedData.thumbnail) {
                embed.setThumbnail(member.user.displayAvatarURL());
            }

            if (embedData.image) {
                embed.setImage(replacePlaceholders(embedData.image, member));
            }

            if (embedData.fields && embedData.fields.length > 0) {
                embed.addFields(embedData.fields.map(field => ({
                    name: replacePlaceholders(field.name, member),
                    value: replacePlaceholders(field.value, member),
                    inline: field.inline,
                })));
            }

            await channel.send({ embeds: [embed] });
        } else {
            const message = replacePlaceholders(welcomeDB.message, member);
            await channel.send({
                content: message,
                files: welcomeDB.imageUrl ? [welcomeDB.imageUrl] : [],
            });
        }

        if (welcomeDB.roleEnabled && welcomeDB.roleId) {
            const role = member.guild.roles.cache.get(welcomeDB.roleId);
            if (role) {
                await member.roles.add(role);
            }
        }
    },
};
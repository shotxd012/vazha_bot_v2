const { Events, AttachmentBuilder } = require('discord.js');
const Guild = require('../../database/models/guild');
const { Canvas } = require('canvacord');
const Logger = require('../../utils/logger');

module.exports = {
	name: Events.GuildMemberAdd,
	once: false,
	async execute(member) {
        const guildId = member.guild.id;
        const guild = await Guild.findOne({ guildId });

        if (!guild || !guild.welcome.enabled || !guild.welcome.channelId) {
            return;
        }

        const welcomeChannel = member.guild.channels.cache.get(guild.welcome.channelId);
        if (!welcomeChannel) {
            return;
        }

        if (guild.welcome.roleId) {
            const role = member.guild.roles.cache.get(guild.welcome.roleId);
            if (role) {
                member.roles.add(role);
            }
        }

        const message = guild.welcome.message
            .replace('{user}', member.user.tag)
            .replace('{server}', member.guild.name);

        try {
            const welcomeCard = await Canvas.welcome({
                username: member.user.username,
                discriminator: member.user.discriminator,
                avatarURL: member.user.displayAvatarURL({ format: 'png', size: 256 }),
                memberCount: member.guild.memberCount,
                guildName: member.guild.name,
                background: guild.welcome.background || 'https://i.imgur.com/8TkXfXj.png',
                color: guild.welcome.color || '#ffffff',
                text: message
            });

            const attachment = new AttachmentBuilder(welcomeCard, { name: 'welcome.png' });

            if (guild.welcome.embed) {
                const embed = {
                    title: 'Welcome!',
                    description: guild.welcome.mention ? `${member}` : '',
                    color: parseInt(guild.welcome.color?.replace('#', '') || 'ffffff', 16),
                    image: {
                        url: 'attachment://welcome.png',
                    },
                };
                welcomeChannel.send({ embeds: [embed], files: [attachment] });
            } else {
                if (guild.welcome.mention) {
                    welcomeChannel.send({ content: `${member}`, files: [attachment] });
                } else {
                    welcomeChannel.send({ files: [attachment] });
                }
            }
        } catch (error) {
            Logger.error(`Error generating welcome card for ${member.user.tag} in ${member.guild.name}: ${error.message}`, 'WelcomeCard');
            Logger.debug(`Stack: ${error.stack}`, 'WelcomeCard');
            
            // Send a simple text welcome message as fallback
            const fallbackMessage = guild.welcome.message
                .replace('{user}', member.user.tag)
                .replace('{server}', member.guild.name);
                
            if (guild.welcome.mention) {
                welcomeChannel.send({ content: `${member} ${fallbackMessage}` });
            } else {
                welcomeChannel.send({ content: fallbackMessage });
            }
        }
	},
};

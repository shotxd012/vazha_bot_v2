const { Events, AttachmentBuilder } = require('discord.js');
const Guild = require('../../database/models/guild');
const Greetify = require('greetify').Greetify;
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
                try {
                    await member.roles.add(role);
                } catch (roleError) {
                    Logger.warn(`Failed to add welcome role to ${member.user.tag}: ${roleError.message}`, 'WelcomeRole');
                }
            }
        }

        const message = (guild.welcome.message || 'Welcome {user} to {server}!')
            .replace('{user}', member.user.tag)
            .replace('{server}', member.guild.name);

        try {
            const greetify = new Greetify()
                .setAvatar(member.user.displayAvatarURL({ format: 'png', size: 256 }))
                .setType('WELCOME')
                .setBackground(guild.welcome.background || 'https://ik.imagekit.io/unburn/greetify-default.png')
                .setUsername(member.user.username)
                .setMemberCount(member.guild.memberCount)
                .setColor(guild.welcome.color || '#00FF9E')
                .setMessage(message);

            // Only set discriminator if it exists and is not '0' (new username system users have discriminator '0')
            if (member.user.discriminator && member.user.discriminator !== '0') {
                greetify.setDiscriminator(member.user.discriminator);
            }
                
            const image = await greetify.build();
            const attachment = new AttachmentBuilder(image, { name: 'welcome.png' });

            if (guild.welcome.embed) {
                const embed = {
                    title: 'Welcome!',
                    description: guild.welcome.mention ? `${member}` : '',
                    color: parseInt((guild.welcome.color || '#00FF9E').replace('#', ''), 16),
                    image: {
                        url: 'attachment://welcome.png',
                    },
                };
                await welcomeChannel.send({ embeds: [embed], files: [attachment] });
            } else {
                if (guild.welcome.mention) {
                    await welcomeChannel.send({ content: `${member}`, files: [attachment] });
                } else {
                    await welcomeChannel.send({ files: [attachment] });
                }
            }
        } catch (error) {
            Logger.error(`Error generating welcome card for ${member.user.tag} in ${member.guild.name}: ${error.message}`, 'WelcomeCard');
            Logger.debug(`Stack: ${error.stack}`, 'WelcomeCard');
            
            // Send a simple text welcome message as fallback
            try {
                const fallbackMessage = (guild.welcome.message || 'Welcome {user} to {server}!')
                    .replace('{user}', member.user.tag)
                    .replace('{server}', member.guild.name);
                    
                if (guild.welcome.mention) {
                    await welcomeChannel.send({ content: `${member} ${fallbackMessage}` });
                } else {
                    await welcomeChannel.send({ content: fallbackMessage });
                }
            } catch (fallbackError) {
                Logger.error(`Failed to send fallback welcome message for ${member.user.tag}: ${fallbackError.message}`, 'WelcomeFallback');
            }
        }
	},
};

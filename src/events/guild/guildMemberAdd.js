const { Events, AttachmentBuilder } = require('discord.js');
const Guild = require('../../database/models/guild');
const Greetify = require('greetify').Greetify;

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

        const greetify = new Greetify()
            .setAvatar(member.user.displayAvatarURL({ format: 'png', size: 256 }))
            .setType('WELCOME')
            .setBackground(guild.welcome.background)
            .setUsername(member.user.username)
            .setDiscriminator(member.user.discriminator)
            .setMemberCount(member.guild.memberCount)
            .setColor(guild.welcome.color)
            .setMessage(message);
            
        const image = await greetify.build();
        const attachment = new AttachmentBuilder(image, { name: 'welcome.png' });

        if (guild.welcome.embed) {
            const embed = {
                title: 'Welcome!',
                description: guild.welcome.mention ? `${member}` : '',
                color: parseInt(guild.welcome.color.replace('#', ''), 16),
                image: {
                    url: 'attachment://welcome.png',
                },
            };
            welcomeChannel.send({ embeds: [embed], files: [attachment] });
        } else {
            if (_guild.welcome.mention) {
                welcomeChannel.send({ content: `${member}`, files: [attachment] });
            } else {
                welcomeChannel.send({ files: [attachment] });
            }
        }
	},
};

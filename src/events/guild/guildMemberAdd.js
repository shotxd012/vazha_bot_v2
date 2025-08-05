const { EmbedBuilder } = require('discord.js');
const Welcome = require('../../database/models/welcome');

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

        const message = welcomeDB.message
            .replace(/{user}/g, member.user.toString())
            .replace(/{server}/g, member.guild.name);

        if (welcomeDB.welcomeType === 'embed') {
            const embed = new EmbedBuilder()
                .setTitle(welcomeDB.embed.title.replace(/{user}/g, member.user.username).replace(/{server}/g, member.guild.name))
                .setDescription(welcomeDB.embed.description.replace(/{user}/g, member.user.toString()).replace(/{server}/g, member.guild.name))
                .setColor(welcomeDB.embed.color)
                .setFooter({ text: welcomeDB.embed.footer.text, iconURL: welcomeDB.embed.footer.iconURL })
                .setTimestamp();

            if (welcomeDB.embed.thumbnail) {
                embed.setThumbnail(member.user.displayAvatarURL());
            }

            if (welcomeDB.embed.image) {
                embed.setImage(welcomeDB.embed.image);
            }

            if (welcomeDB.embed.fields && welcomeDB.embed.fields.length > 0) {
                embed.addFields(welcomeDB.embed.fields);
            }

            await channel.send({ embeds: [embed] });
        } else {
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
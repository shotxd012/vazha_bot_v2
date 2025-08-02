const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Shows detailed information about the server'),
    
    cooldown: 10,
    
    async execute(interaction) {
        try {
            const guild = interaction.guild;
            
            // Fetch guild with all members for accurate counts
            await guild.fetch();
            
            // Get server creation date
            const createdAt = Math.floor(guild.createdTimestamp / 1000);
            
            // Get owner
            const owner = await guild.fetchOwner();
            
            // Get member counts
            const totalMembers = guild.memberCount;
            const botCount = guild.members.cache.filter(member => member.user.bot).size;
            const humanCount = totalMembers - botCount;
            
            // Get channel counts
            const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
            const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
            const categories = guild.channels.cache.filter(channel => channel.type === 4).size;
            const totalChannels = textChannels + voiceChannels + categories;
            
            // Get role counts
            const totalRoles = guild.roles.cache.size;
            const managedRoles = guild.roles.cache.filter(role => role.managed).size;
            const customRoles = totalRoles - managedRoles;
            
            // Get emoji counts
            const totalEmojis = guild.emojis.cache.size;
            const animatedEmojis = guild.emojis.cache.filter(emoji => emoji.animated).size;
            const staticEmojis = totalEmojis - animatedEmojis;
            
            // Get boost information
            const boostLevel = guild.premiumTier;
            const boostCount = guild.premiumSubscriptionCount;
            const maxBoosts = [0, 2, 6, 14][boostLevel] || 0;
            
            // Get verification level
            const verificationLevels = {
                0: 'None',
                1: 'Low',
                2: 'Medium',
                3: 'High',
                4: 'Very High'
            };
            
            // Get explicit content filter
            const contentFilterLevels = {
                0: 'Disabled',
                1: 'No Role',
                2: 'All Members'
            };
            
            // Get features
            const features = guild.features.map(feature => 
                feature.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            );
            
            // Get top roles (excluding @everyone)
            const topRoles = guild.roles.cache
                .filter(role => role.id !== guild.id && role.hoist)
                .sort((a, b) => b.position - a.position)
                .first(5);
            
            // Get server emojis
            const serverEmojis = guild.emojis.cache.first(10);
            
            // Create main embed
            const embed = new EmbedBuilder()
                .setColor(0x2f3136)
                .setTitle(guild.name)
                .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
                .setTimestamp()
                .setFooter({ 
                    text: `Server ID: ${guild.id}`,
                    iconURL: guild.iconURL({ dynamic: true })
                });
            
            // Server Overview
            let description = `**Server Overview**\n`;
            description += `• **Owner:** ${owner.user.tag}\n`;
            description += `• **Created:** <t:${createdAt}:F> (<t:${createdAt}:R>)\n`;
            description += `• **Verification:** ${verificationLevels[guild.verificationLevel]}\n`;
            description += `• **Content Filter:** ${contentFilterLevels[guild.explicitContentFilter]}\n`;
            
            if (guild.description) {
                description += `• **Description:** ${guild.description}\n`;
            }
            
            embed.setDescription(description);
            
            // Statistics
            const statsFields = [
                {
                    name: 'Members',
                    value: `**${totalMembers.toLocaleString()}** total\n${humanCount.toLocaleString()} humans • ${botCount.toLocaleString()} bots`,
                    inline: true
                },
                {
                    name: 'Channels',
                    value: `**${totalChannels.toLocaleString()}** total\n${textChannels} text • ${voiceChannels} voice • ${categories} categories`,
                    inline: true
                },
                {
                    name: 'Roles',
                    value: `**${totalRoles.toLocaleString()}** total\n${customRoles} custom • ${managedRoles} managed`,
                    inline: true
                },
                {
                    name: 'Emojis',
                    value: `**${totalEmojis.toLocaleString()}** total\n${staticEmojis} static • ${animatedEmojis} animated`,
                    inline: true
                },
                {
                    name: 'Boost Level',
                    value: `**Level ${boostLevel}**\n${boostCount}/${maxBoosts} boosts`,
                    inline: true
                },
                {
                    name: 'Features',
                    value: features.length > 0 ? features.slice(0, 3).join(', ') : 'None',
                    inline: true
                }
            ];
            
            embed.addFields(statsFields);
            
            // Top Roles
            if (topRoles.length > 0) {
                const topRolesText = topRoles.map(role => 
                    `${role} (${role.members.size} members)`
                ).join('\n');
                
                embed.addFields({
                    name: 'Top Roles',
                    value: topRolesText,
                    inline: false
                });
            }
            
            // Server Emojis
            if (serverEmojis.length > 0) {
                const emojiText = serverEmojis.map(emoji => 
                    `${emoji} \`${emoji.name}\``
                ).join(' ');
                
                embed.addFields({
                    name: 'Server Emojis',
                    value: emojiText + (totalEmojis > 10 ? `\n*and ${totalEmojis - 10} more...*` : ''),
                    inline: false
                });
            }
            
            // Additional Features
            if (features.length > 3) {
                embed.addFields({
                    name: 'All Features',
                    value: features.join(', '),
                    inline: false
                });
            }
            
            // Server Banner
            if (guild.banner) {
                embed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            Logger.error(`Error in serverinfo command: ${error.message}`, 'ServerInfo');
            throw new Error(`Failed to execute serverinfo command: ${error.message}`);
        }
    }
}; 
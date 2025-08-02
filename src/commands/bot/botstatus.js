const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
require('moment-duration-format');
const os = require('os');
const config = require('../../../config/config');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botstatus')
        .setDescription('Shows detailed statistics about the bot.'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const client = interaction.client;
            
            // --- Basic Stats ---
            const uptime = moment.duration(client.uptime).format(' D [days], H [hrs], m [mins], s [secs]');
            const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            
            // --- Discord Stats ---
            const guilds = client.guilds.cache.size;
            const users = client.users.cache.size;
            const channels = client.channels.cache.size;
            const ping = client.ws.ping;
            
            // --- Host Stats ---
            const cpuModel = os.cpus()[0].model;
            const platform = os.platform();
            
            // --- Build Embed ---
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle('Vazha Bot Status')
                .setThumbnail(client.user.displayAvatarURL())
                .addFields(
                    { name: '📊 Core Stats', value: `**Guilds:** ${guilds}\n**Users:** ${users}\n**Channels:** ${channels}`, inline: true },
                    { name: '⏱️ Uptime', value: uptime, inline: true },
                    { name: '🏓 Ping', value: `**API:** ${ping}ms`, inline: true },
                    { name: '🧠 Memory', value: `${memoryUsage} MB`, inline: true },
                    { name: '💻 Host', value: `**Platform:** ${platform}\n**CPU:** ${cpuModel}`, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Vazha Bot | Status' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            Logger.error(`Error in botstatus command: ${error.message}`, 'BotStatus');
            await interaction.editReply({ content: 'An error occurred while fetching bot status.', ephemeral: true });
        }
    }
};
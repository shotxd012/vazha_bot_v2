const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
require('moment-duration-format');
const os = require('os');
const User = require('../../database/models/user');
const config = require('../../../config/config');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot')
        .setDescription('Shows bot-related information.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Shows detailed statistics about the bot.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('userstats')
                .setDescription('Shows global statistics about the bot\'s users.')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            await interaction.deferReply();

            if (subcommand === 'status') {
                await this.executeStatus(interaction);
            } else if (subcommand === 'userstats') {
                await this.executeUserStats(interaction);
            }

        } catch (error) {
            Logger.error(`Error executing /bot ${subcommand}: ${error.message}`, 'BotCommand');
            await interaction.editReply({ content: 'An error occurred while executing this command.', ephemeral: true });
        }
    },

    async executeStatus(interaction) {
        const client = interaction.client;
        
        // --- Core Stats ---
        const uptime = moment.duration(client.uptime).format('D[d] H[h] m[m] s[s]');
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        
        // --- Discord Stats ---
        const guilds = client.guilds.cache.size.toLocaleString();
        const users = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toLocaleString();
        const channels = client.channels.cache.size.toLocaleString();
        const ping = client.ws.ping;

        // --- Host Stats ---
        const cpuModel = os.cpus()[0].model.split('@')[0].trim();
        const platform = os.platform();

        // --- Build Embed ---
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle('Vazha Bot Status')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '📊 Core Stats', value: `**Guilds:** ${guilds}\n**Users:** ${users}\n**Channels:** ${channels}`, inline: true },
                { name: '⏱️ Uptime', value: uptime, inline: true },
                { name: '🏓 Ping', value: `${ping}ms`, inline: true },
                { name: '🧠 Memory', value: `${memoryUsage} MB`, inline: true },
                { name: '💻 Host Platform', value: platform, inline: true },
                { name: '🤖 Bot Version', value: require('../../../package.json').version, inline: true}
            )
            .setTimestamp()
            .setFooter({ text: 'Vazha Bot | Status' });

        await interaction.editReply({ embeds: [embed] });
    },

    async executeUserStats(interaction) {
        // --- Database Queries ---
        const totalUsers = await User.countDocuments();
        
        const startOfToday = moment().startOf('day').toDate();
        const newUsersToday = await User.countDocuments({ createdAt: { $gte: startOfToday } });
        
        const startOfWeek = moment().startOf('isoWeek').toDate();
        const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: startOfWeek } });

        const topUserDoc = await User.findOne().sort({ 'commandStats.totalCommands': -1 }).limit(1);
        
        let topUserString = 'N/A';
        if (topUserDoc) {
            try {
                // Fetch user to ensure the tag is up-to-date
                const topUser = await interaction.client.users.fetch(topUserDoc.discordId);
                topUserString = `**${topUser.tag}** (${topUserDoc.commandStats.totalCommands.toLocaleString()} commands)`;
            } catch {
                // Fallback if user is no longer in a shared server
                topUserString = `*${topUserDoc.username}* (${topUserDoc.commandStats.totalCommands.toLocaleString()} commands)`;
            }
        }

        // --- Build Embed ---
        const embed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('Global User Statistics')
            .setDescription('An overview of all users who have interacted with the bot.')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { name: '👥 Total Unique Users', value: `\`${totalUsers.toLocaleString()}\``, inline: true },
                { name: '☀️ New Users Today', value: `\`${newUsersToday.toLocaleString()}\``, inline: true },
                { name: '📅 New Users This Week', value: `\`${newUsersThisWeek.toLocaleString()}\``, inline: true },
                { name: '🏆 Top User', value: topUserString, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Vazha Bot | User Insights' });

        await interaction.editReply({ embeds: [embed] });
    }
};
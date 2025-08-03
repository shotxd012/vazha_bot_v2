const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const WelcomeSettings = require('../../database/models/welcome');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure the welcome system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set up the welcome system for this server.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-channel')
                .setDescription('Sets the welcome channel.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send welcome messages to.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'setup') {
            try {
                await WelcomeSettings.findOneAndUpdate(
                    { guildId },
                    { guildId },
                    { upsert: true, new: true }
                );

                const embed = new EmbedBuilder()
                    .setTitle('Welcome System Setup')
                    .setDescription('You can configure your welcome settings on our website.')
                    .setColor('Green');

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Configure')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://yourbotwebsite.com/welcome?guild=${guildId}`)
                    );

                await interaction.reply({ embeds: [embed], components: [row] });
            } catch (error) {
                console.error('Error setting up welcome system:', error);
                await interaction.reply({ content: 'There was an error while setting up the welcome system.', ephemeral: true });
            }
        } else if (subcommand === 'set-channel') {
            const channel = interaction.options.getChannel('channel');

            try {
                const settings = await WelcomeSettings.findOneAndUpdate(
                    { guildId },
                    { guildId, welcomeChannel: channel.id },
                    { upsert: true, new: true }
                );

                // Update the cached settings
                interaction.client.welcomeSettings.set(guildId, settings);

                await interaction.reply({ content: `Welcome channel has been set to ${channel}.`, ephemeral: true });
            } catch (error) {
                console.error('Error setting welcome channel:', error);
                await interaction.reply({ content: 'There was an error while setting the welcome channel.', ephemeral: true });
            }
        }
    },
};

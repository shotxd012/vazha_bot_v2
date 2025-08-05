const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Welcome = require('../../database/models/welcome');
const config = require('../../../config/config');

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
                .setName('enable')
                .setDescription('Enable the welcome system.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable the welcome system.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('Set the welcome channel.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send welcome messages to.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('type')
                .setDescription('Set the welcome type.')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of welcome message.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Embed', value: 'embed' },
                            { name: 'Text', value: 'text' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('message')
                .setDescription('Set the welcome message (for text type).')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('The welcome message. Use {user} for user mention and {server} for server name.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('image')
                .setDescription('Set the image URL (for text type).')
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('The URL of the image.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('role')
                .setDescription('Set the welcome role.')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to give to new members.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('embed')
                .setDescription('Configure the welcome embed.')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'setup') {
            try {
                let welcomeDB = await Welcome.findOne({ guildId });
                if (!welcomeDB) {
                    welcomeDB = new Welcome({ guildId });
                    await welcomeDB.save();
                }

                const embed = new EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setTitle('🎉 Welcome System Setup')
                    .setDescription('The welcome system has been set up for this server. You can now configure it using the other subcommands or by using the dashboard.')
                    .addFields({ name: 'Dashboard', value: `[Click here to configure](https://vazha.tokyomc.fun/dashboard/${guildId})` });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Configure on Dashboard')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://vazha.tokyomc.fun/dashboard/${guildId}`)
                    );

                await interaction.reply({ embeds: [embed], components: [row] });
            } catch (error) {
                console.error('Error setting up welcome system:', error);
                await interaction.reply({ content: 'There was an error while setting up the welcome system.', ephemeral: true });
            }
        } else if (subcommand === 'enable') {
            await Welcome.findOneAndUpdate({ guildId }, { enabled: true }, { upsert: true });
            await interaction.reply({ content: 'Welcome system enabled.', ephemeral: true });
        } else if (subcommand === 'disable') {
            await Welcome.findOneAndUpdate({ guildId }, { enabled: false }, { upsert: true });
            await interaction.reply({ content: 'Welcome system disabled.', ephemeral: true });
        } else if (subcommand === 'channel') {
            const channel = interaction.options.getChannel('channel');
            await Welcome.findOneAndUpdate({ guildId }, { channelId: channel.id }, { upsert: true });
            await interaction.reply({ content: `Welcome channel set to ${channel}.`, ephemeral: true });
        } else if (subcommand === 'type') {
            const type = interaction.options.getString('type');
            await Welcome.findOneAndUpdate({ guildId }, { welcomeType: type }, { upsert: true });
            await interaction.reply({ content: `Welcome type set to ${type}.`, ephemeral: true });
        } else if (subcommand === 'message') {
            const message = interaction.options.getString('message');
            await Welcome.findOneAndUpdate({ guildId }, { message }, { upsert: true });
            await interaction.reply({ content: 'Welcome message updated.', ephemeral: true });
        } else if (subcommand === 'image') {
            const url = interaction.options.getString('url');
            await Welcome.findOneAndUpdate({ guildId }, { imageUrl: url }, { upsert: true });
            await interaction.reply({ content: 'Welcome image updated.', ephemeral: true });
        } else if (subcommand === 'role') {
            const role = interaction.options.getRole('role');
            await Welcome.findOneAndUpdate({ guildId }, { roleId: role.id, roleEnabled: true }, { upsert: true });
            await interaction.reply({ content: `Welcome role set to ${role}.`, ephemeral: true });
        } else if (subcommand === 'embed') {
            const welcomeDB = await Welcome.findOne({ guildId });

            const modal = new ModalBuilder()
                .setCustomId('welcomeEmbedModal')
                .setTitle('Configure Welcome Embed');

            const titleInput = new TextInputBuilder()
                .setCustomId('title')
                .setLabel('Title')
                .setStyle(TextInputStyle.Short)
                .setValue(welcomeDB?.embed?.title || 'Welcome!');

            const descriptionInput = new TextInputBuilder()
                .setCustomId('description')
                .setLabel('Description')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(welcomeDB?.embed?.description || 'Welcome {user} to {server}!');

            const colorInput = new TextInputBuilder()
                .setCustomId('color')
                .setLabel('Color (Hex Code)')
                .setStyle(TextInputStyle.Short)
                .setValue(welcomeDB?.embed?.color || '#00ff00');
            
            const imageInput = new TextInputBuilder()
                .setCustomId('image')
                .setLabel('Image URL')
                .setStyle(TextInputStyle.Short)
                .setValue(welcomeDB?.embed?.image || '');

            const footerInput = new TextInputBuilder()
                .setCustomId('footer')
                .setLabel('Footer Text')
                .setStyle(TextInputStyle.Short)
                .setValue(welcomeDB?.embed?.footer?.text || 'Vazha Bot');

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(colorInput),
                new ActionRowBuilder().addComponents(imageInput),
                new ActionRowBuilder().addComponents(footerInput)
            );

            await interaction.showModal(modal);
        }
    },
};
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');
const Guild = require('../../database/models/guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure the welcome message for this server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('An interactive setup for the welcome message.')
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        const getGuild = async () => {
            let guild = await Guild.findOne({ guildId });
            if (!guild) {
                guild = new Guild({ guildId });
                await guild.save();
            }
            return guild;
        };

        const createWelcomeEmbed = (guildData) => {
            const welcomeStatus = guildData.welcome.enabled ? '✅ Enabled' : '❌ Disabled';
            const welcomeChannel = guildData.welcome.channelId ? `<#${guildData.welcome.channelId}>` : 'Not Set';
            const welcomeRole = guildData.welcome.roleId ? `<@&${guildData.welcome.roleId}>` : 'Not Set';
            const embedStatus = guildData.welcome.embed ? '✅ Enabled' : '❌ Disabled';
            const mentionStatus = guildData.welcome.mention ? '✅ Enabled' : '❌ Disabled';

            return new EmbedBuilder()
                .setTitle('Welcome Configuration')
                .setColor(guildData.welcome.color)
                .setDescription('Use the buttons below to configure the welcome message.')
                .addFields(
                    { name: 'Status', value: welcomeStatus, inline: true },
                    { name: 'Channel', value: welcomeChannel, inline: true },
                    { name: 'Autorole', value: welcomeRole, inline: true },
                    { name: 'Use Embed', value: embedStatus, inline: true },
                    { name: 'Mention User', value: mentionStatus, inline: true },
                    { name: 'Card Color', value: `\`${guildData.welcome.color}\``, inline: true },
                    { name: 'Message', value: `\`\`\`${guildData.welcome.message}\`\`\`` }
                )
                .setImage(guildData.welcome.background)
                .setFooter({ text: 'Welcome Setup Menu' })
                .setTimestamp();
        };

        const createActionRows = (guildData) => {
            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('welcome-enable-disable')
                        .setLabel(guildData.welcome.enabled ? 'Disable' : 'Enable')
                        .setStyle(guildData.welcome.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('welcome-set-channel')
                        .setLabel('Set Channel')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('welcome-set-role')
                        .setLabel('Set Role')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('welcome-toggle-embed')
                        .setLabel(guildData.welcome.embed ? 'Disable Embed' : 'Enable Embed')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('welcome-toggle-mention')
                        .setLabel(guildData.welcome.mention ? 'Disable Mention' : 'Enable Mention')
                        .setStyle(ButtonStyle.Secondary)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('welcome-edit-message')
                        .setLabel('Edit Message')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('welcome-edit-background')
                        .setLabel('Edit Background')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('welcome-edit-color')
                        .setLabel('Edit Color')
                        .setStyle(ButtonStyle.Secondary)
                );
            return [row1, row2];
        };

        let guildData = await getGuild();
        const embed = createWelcomeEmbed(guildData);
        const actionRows = createActionRows(guildData);

        const reply = await interaction.reply({
            embeds: [embed],
            components: actionRows,
            ephemeral: true
        });

        const collector = reply.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 300000 // 5 minutes
        });

        const editReply = async (payload) => {
            try {
                await interaction.editReply(payload);
            } catch (error) {
                if (error.code !== 10008) { // Ignore "Unknown Message"
                    console.error("Failed to edit reply:", error);
                }
            }
        };

        collector.on('collect', async i => {
            try {
                guildData = await getGuild(); // Refresh data
    
                if (i.customId === 'welcome-enable-disable') {
                    await i.deferUpdate();
                    guildData.welcome.enabled = !guildData.welcome.enabled;
                    await guildData.save();
                    await editReply({ embeds: [createWelcomeEmbed(guildData)], components: createActionRows(guildData) });
                } else if (i.customId === 'welcome-toggle-embed') {
                    await i.deferUpdate();
                    guildData.welcome.embed = !guildData.welcome.embed;
                    await guildData.save();
                    await editReply({ embeds: [createWelcomeEmbed(guildData)], components: createActionRows(guildData) });
                } else if (i.customId === 'welcome-toggle-mention') {
                    await i.deferUpdate();
                    guildData.welcome.mention = !guildData.welcome.mention;
                    await guildData.save();
                    await editReply({ embeds: [createWelcomeEmbed(guildData)], components: createActionRows(guildData) });
                } else if (i.customId === 'welcome-set-channel') {
                    await i.deferUpdate();
                    const followUp = await i.followUp({ content: 'Please send the channel you want to set for welcome messages in the next message.', ephemeral: true });
                    const filter = m => m.author.id === interaction.user.id;
                    const messageCollector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });
    
                    messageCollector.on('collect', async m => {
                        const channel = m.mentions.channels.first() || m.guild.channels.cache.get(m.content);
                        if (channel && channel.type === ChannelType.GuildText) {
                            guildData.welcome.channelId = channel.id;
                            await guildData.save();
                            await m.delete().catch(() => {});
                            await followUp.edit({ content: `✅ Welcome channel set to ${channel}.` }).catch(() => {});
                            await editReply({ embeds: [createWelcomeEmbed(guildData)], components: createActionRows(guildData) });
                        } else {
                            await m.delete().catch(() => {});
                            await followUp.edit({ content: '❌ Invalid channel. Please mention a text channel or provide its ID.' }).catch(() => {});
                        }
                         setTimeout(() => followUp.delete().catch(() => {}), 3000);
                    });
                } else if (i.customId === 'welcome-set-role') {
                    await i.deferUpdate();
                    const followUp = await i.followUp({ content: 'Please send the role you want to set for new members in the next message.', ephemeral: true });
                    const filter = m => m.author.id === interaction.user.id;
                    const messageCollector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });
    
                    messageCollector.on('collect', async m => {
                        const role = m.mentions.roles.first() || m.guild.roles.cache.get(m.content);
                        if (role) {
                            guildData.welcome.roleId = role.id;
                            await guildData.save();
                            await m.delete().catch(() => {});
                            await followUp.edit({ content: `✅ Welcome role set to ${role}.` }).catch(() => {});
                            await editReply({ embeds: [createWelcomeEmbed(guildData)], components: createActionRows(guildData) });
                        } else {
                            await m.delete().catch(() => {});
                            await followUp.edit({ content: '❌ Invalid role. Please mention a role or provide its ID.' }).catch(() => {});
                        }
                        setTimeout(() => followUp.delete().catch(() => {}), 3000);
                    });
                } else if (i.customId.startsWith('welcome-edit-')) {
                    const modalType = i.customId.split('-')[2];
                    
                    const modal = new ModalBuilder()
                        .setCustomId(`welcome-${modalType}-modal`)
                        .setTitle(`Edit Welcome ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`);
    
                    const textInput = new TextInputBuilder()
                        .setCustomId(`welcome-${modalType}-input`)
                        .setLabel(modalType === 'message' ? 'Welcome Message' : (modalType === 'background' ? 'Image URL' : 'Hex Color Code'))
                        .setStyle(modalType === 'message' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                        .setValue(guildData.welcome[modalType]);
                    
                    modal.addComponents(new ActionRowBuilder().addComponents(textInput));
    
                    await i.showModal(modal);
    
                    try {
                        const modalInteraction = await i.awaitModalSubmit({
                            filter: mi => mi.user.id === i.user.id && mi.customId === `welcome-${modalType}-modal`,
                            time: 120000 
                        });
    
                        await modalInteraction.deferUpdate();
                        const value = modalInteraction.fields.getTextInputValue(`welcome-${modalType}-input`);
                        
                        if (modalType === 'color' && !/^#[0-9A-F]{6}$/i.test(value)) {
                            const followUp = await i.followUp({ content: '❌ Invalid hex color code. Please use a valid format (e.g., #FF5733).', ephemeral: true });
                            setTimeout(() => followUp.delete().catch(() => {}), 3000);
                            return;
                        }
                        
                        guildData.welcome[modalType] = value;
                        await guildData.save();
                        
                        await editReply({ embeds: [createWelcomeEmbed(guildData)], components: createActionRows(guildData) });
    
                    } catch (err) {
                       // User took too long
                    }
                }
            } catch (error) {
                console.error("Error in collector:", error);
            }
        });

        collector.on('end', () => {
            const endEmbed = new EmbedBuilder()
                .setTitle('Welcome Setup Ended')
                .setColor('#FF0000')
                .setDescription('The interactive setup has ended or was dismissed.');

            editReply({ embeds: [endEmbed], components: [] });
        });
    },
};
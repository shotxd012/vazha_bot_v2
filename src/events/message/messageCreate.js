const { WebhookClient } = require('discord.js');
const Functions = require('../../database/models/functions');
const afk = require('../../database/models/afk');
const chatBotSchema = require('../../database/models/chatbot-channel');
const messagesSchema = require('../../database/models/messages');
const messageSchema = require('../../database/models/levelMessages');
const messageRewards = require('../../database/models/messageRewards');
const StickyMessage = require('../../database/models/stickymessages');
const levelRewards = require('../../database/models/levelRewards');
const levelLogs = require('../../database/models/levelChannels');
const Commands = require('../../database/models/customCommand');
const CommandsSchema = require('../../database/models/customCommandAdvanced');
const fetch = require('node-fetch');
const Logger = require('../../utils/logger');
const EmbedBuilderUtil = require('../../utils/embedBuilder');
const config = require('../../../config/config');

module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        if (message.author.bot) return;

        // DM Logging
        if (message.channel.type === 1) { // DM
            if (!config.webhooks.dmLogs.id || !config.webhooks.dmLogs.token) {
                return Logger.warn('DM logging webhook not configured.', 'messageCreate');
            }
            const dmLog = new WebhookClient({
                id: config.webhooks.dmLogs.id,
                token: config.webhooks.dmLogs.token,
            });

            const embed = EmbedBuilderUtil.info(
                'New DM Message',
                `Bot has received a new DM message.`,
                [
                    { name: 'Sent By', value: `${message.author} (${message.author.tag})`, inline: true },
                    { name: 'Message', value: `${message.content || 'None'}`, inline: true },
                ]
            );

            if (message.attachments.size > 0) {
                embed.addFields({ name: 'Attachments', value: `${message.attachments.first()?.url}`, inline: false });
            }
            return dmLog.send({ username: 'Bot DM', embeds: [embed] });
        }

        const functionData = await Functions.findOne({ Guild: message.guild.id });

        // Levels
        if (functionData && functionData.Levels) {
            const randomXP = Math.floor(Math.random() * 9) + 1;
            const hasLeveledUp = await client.addXP(message.author.id, message.guild.id, randomXP);

            if (hasLeveledUp) {
                const user = await client.fetchLevels(message.author.id, message.guild.id);
                const levelData = await levelLogs.findOne({ Guild: message.guild.id });
                const messageData = await messageSchema.findOne({ Guild: message.guild.id });

                let levelMessage;
                if (messageData && messageData.Message) {
                    levelMessage = messageData.Message
                        .replace(/{user:username}/g, message.author.username)
                        .replace(/{user:discriminator}/g, message.author.discriminator)
                        .replace(/{user:tag}/g, message.author.tag)
                        .replace(/{user:mention}/g, message.author.toString())
                        .replace(/{user:level}/g, user.level)
                        .replace(/{user:xp}/g, user.xp);
                } else {
                    levelMessage = `**GG** ${message.author}, you are now level **${user.level}**`;
                }

                try {
                    const channel = levelData ? await client.channels.cache.get(levelData.Channel) : message.channel;
                    await channel.send({ content: levelMessage });
                } catch (error) {
                    Logger.error(`Could not send level up message: ${error.message}`, 'messageCreate');
                }

                const reward = await levelRewards.findOne({ Guild: message.guild.id, Level: user.level });
                if (reward) {
                    try {
                        await message.member.roles.add(reward.Role);
                    } catch (error) {
                        Logger.warn(`Could not add level reward role to ${message.author.tag}: ${error.message}`, 'messageCreate');
                    }
                }
            }
        }
    }
};

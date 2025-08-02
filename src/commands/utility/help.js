const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists all available commands or info about a specific command.')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The command to get help for')
                .setRequired(false)
                .setAutocomplete(true)),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const choices = interaction.client.commands.map(command => command.data.name);
        const filtered = choices.filter(choice => choice.startsWith(focusedValue));
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice })),
        );
    },

    async execute(interaction) {
        try {
            const commandName = interaction.options.getString('command');

            // --- Single Command Help ---
            if (commandName) {
                const command = interaction.client.commands.get(commandName);
                if (!command) {
                    const embed = new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setTitle('Command Not Found')
                        .setDescription(`The command \`/${commandName}\` does not exist.`);
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setTitle(`Help: \`/${command.data.name}\``)
                    .setDescription(command.data.description || 'No description available.');

                if (command.data.options && command.data.options.length > 0) {
                    const optionsString = command.data.options.map(opt => {
                        const required = opt.required ? ' (required)' : '';
                        return `\`${opt.name}\`${required}: ${opt.description}`;
                    }).join('\n');
                    embed.addFields({ name: 'Options', value: optionsString });
                }
                
                if (command.cooldown) {
                    embed.addFields({ name: 'Cooldown', value: `${command.cooldown} second(s)`, inline: true });
                }

                return interaction.reply({ embeds: [embed] });
            }

            // --- Full Command List ---
            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle('Vazha Bot Help')
                .setDescription('Here is a list of all my available commands. For more details on a specific command, use `/help <command>`.')
                .setTimestamp()
                .setFooter({ text: 'Vazha Bot' });

            const commandsByFolder = {};
            const commandFoldersPath = path.join(__dirname, '..');
            const commandFolders = fs.readdirSync(commandFoldersPath);

            for (const folder of commandFolders) {
                if (fs.statSync(path.join(commandFoldersPath, folder)).isDirectory()) {
                    // Capitalize the folder name for the embed field title
                    const categoryName = folder.charAt(0).toUpperCase() + folder.slice(1);
                    commandsByFolder[categoryName] = [];
                }
            }

            interaction.client.commands.forEach(cmd => {
                // Find which folder the command belongs to
                const commandPath = require.resolve(path.join(commandFoldersPath, '..', 'commands', cmd.data.name));
                const folder = path.basename(path.dirname(commandPath));
                const categoryName = folder.charAt(0).toUpperCase() + folder.slice(1);
                
                if (commandsByFolder[categoryName]) {
                    commandsByFolder[categoryName].push(`\`/${cmd.data.name}\``);
                }
            });

            for (const category in commandsByFolder) {
                if (commandsByFolder[category].length > 0) {
                    embed.addFields({
                        name: `**${category}**`,
                        value: commandsByFolder[category].join(', '),
                        inline: false,
                    });
                }
            }
            
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            Logger.error(`Error in help command: ${error.message}`, 'HelpCommand');
            await interaction.reply({ content: 'An error occurred while generating the help message.', ephemeral: true });
        }
    }
};
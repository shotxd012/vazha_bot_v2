const { SlashCommandBuilder } = require('discord.js');
const EmbedBuilderUtil = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Shows the bot\'s latency and response time'),
    
    cooldown: 5,
    
    async execute(interaction) {
        try {
            // Calculate latencies
            const wsLatency = interaction.client.ws.ping;
            const apiLatency = Date.now() - interaction.createdTimestamp;
            
            // Create ping embed
            const embed = EmbedBuilderUtil.ping(wsLatency, apiLatency);
            
            // Add a test button for fun
            const row = {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 1,
                        label: 'Test Ping Again',
                        custom_id: 'ping_test'
                    }
                ]
            };
            
            await interaction.reply({ 
                embeds: [embed], 
                components: [row] 
            });
            
        } catch (error) {
            throw new Error(`Failed to execute ping command: ${error.message}`);
        }
    }
}; 
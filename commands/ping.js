const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("pong"),
    async execute(interaction, client) {
        try {
            await interaction.reply("pong")
        }
        catch (error) {
            console.log("error sending message");
        }
    }
}
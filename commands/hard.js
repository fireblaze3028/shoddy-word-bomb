const { SlashCommandBuilder } = require("discord.js");
const database = require('../utility/database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("hard-mode")
        .setDescription("Toggles harder prompts in this server.")
        .setDMPermission(false),
    async execute(interaction, client) {
        // get channel being used to play from server id
        // then call the instance of the game to toggle hard mode
        var correctChannel = database.getChannelFromServer(interaction.guild.id);
        if (correctChannel == undefined) {
            interaction.reply({ content: "You must set the channel to enable this.", ephemeral: true })
            .catch("error sending message");
        }
        else if (correctChannel != interaction.channel.id) {
            interaction.reply({ content: "Please use this command in the channel that is being played in.", ephemeral: true})
            .catch("error sending message");
        }
        else {
            client.emit(`${correctChannel}-hard`, interaction);
        }
    }
}
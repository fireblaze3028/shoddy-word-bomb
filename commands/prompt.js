const { SlashCommandBuilder } = require("discord.js");
const database = require('../utility/database.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("prompt")
    .setDescription("Reprints the current prompt.")
    .setDMPermission(false),
    async execute(interaction, client) {
        // get channel being used to play from server id
        // then call the instance of the game to send prompt
        var correctChannel = database.getChannelFromServer(interaction.guild.id);
        if (correctChannel == undefined) {
            try {
                interaction.reply({ content: "You must set the channel to enable this.", ephemeral: true })
            }
            catch (error) {
                console.log("error sending message");
            }
        }
        else if (correctChannel != interaction.channel.id) {
            try {
                interaction.reply({ content: "Please use this command in the channel that is being played in.", ephemeral: true})
            }
            catch (error) {
                console.log("error sending message");
            }
        }
        else {
            client.emit(`${correctChannel}-prompt`, interaction);
        }
    }
}